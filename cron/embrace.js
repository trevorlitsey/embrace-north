const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const axios = require("axios");
const { DateTime } = require("luxon");

const GROUPED_WINDOW_MINUTES = 15;

const findOpenTime = async (times, minSpots = 1) => {
  const date = DateTime.fromISO(times[0])
    .setZone("America/Chicago")
    .toFormat("yyyy-MM-dd");

  console.log("----------------");
  console.log(
    `> ${DateTime.now()
      .setZone("America/Chicago")
      .toFormat("yyyy-MM-dd h:mm a")}`
  );
  console.log(`> checking for open times for ${date} (minSpots=${minSpots})`);

  const classesRes = await axios.get(
    `https://embracenorth.marianatek.com/api/customer/v1/classes?min_start_date=${date}&max_start_date=${date}&page_size=500&region=48541`
  );

  // Classes that match requested times and have at least 1 open spot
  const matchingClasses = classesRes.data.results
    .filter(
      (c) =>
        c.available_spot_count >= 1 &&
        times.some((t) => DateTime.fromISO(t).equals(DateTime.fromISO(c.start_datetime)))
    )
    .sort((a, b) =>
      DateTime.fromISO(a.start_datetime) - DateTime.fromISO(b.start_datetime)
    );

  // First: try to find a single class with enough spots (original behavior)
  const singleMatch = matchingClasses.find((c) => c.available_spot_count >= minSpots);

  if (singleMatch) {
    console.log(
      `> single match found: ${DateTime.fromISO(singleMatch.start_datetime)
        .setZone("America/Chicago")
        .toFormat("h:mm a")} (${singleMatch.available_spot_count} spots)`
    );
    return [singleMatch.id, singleMatch.start_datetime, singleMatch.available_spot_count, null];
  }

  // Second: if minSpots > 1, check if multiple classes within GROUPED_WINDOW_MINUTES
  // have enough combined spots
  if (minSpots > 1 && matchingClasses.length >= 2) {
    for (let i = 0; i < matchingClasses.length; i++) {
      const anchor = DateTime.fromISO(matchingClasses[i].start_datetime);
      const group = matchingClasses.filter((c) => {
        const diff = Math.abs(
          DateTime.fromISO(c.start_datetime).diff(anchor, "minutes").minutes
        );
        return diff <= GROUPED_WINDOW_MINUTES;
      });

      const totalSpots = group.reduce((sum, c) => sum + c.available_spot_count, 0);

      if (totalSpots >= minSpots) {
        const groupedTimes = group.map((c) => c.start_datetime);
        console.log(
          `> grouped match found: ${groupedTimes
            .map((t) => DateTime.fromISO(t).setZone("America/Chicago").toFormat("h:mm a"))
            .join(" + ")} (${totalSpots} total spots across ${group.length} classes)`
        );
        // Return the earliest class in the group as the primary
        return [group[0].id, group[0].start_datetime, totalSpots, groupedTimes];
      }
    }
  }

  console.log(
    `> no open times found for ${times
      .map((t) =>
        DateTime.fromISO(t)
          .setZone("America/Chicago")
          .toFormat("yyyy-MM-dd h:mm a")
      )
      .join(", ")}.`
  );
  return [];
};

const getUserAccessToken = async (username, password) => {
  console.log("> fetching user token");

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const page = await browser.newPage();

  await page.goto(
    "https://embracenorth.marianaiframes.com/iframe/account/reservations"
  );

  let accessToken;

  page.on("response", async (response) => {
    if (response.url().includes("/o/token")) {
      const body = await response.json();
      accessToken = body.access_token;
    }
  });

  // login
  await page.waitForSelector('button[data-test-button="log-in"]');
  await page.click('button[data-test-button="log-in"]');
  await page.waitForSelector('input[name="username"]');
  await page.type('input[name="username"]', username);
  await page.type('input[name="password"]', password);
  await page.click('button[type="submit"]');

  let n = 0;
  while (n < 10 && !accessToken) {
    await new Promise((res) => setTimeout(res, 1000));
    n++;
  }

  await browser.close();

  if (!accessToken) {
    throw new Error("Could not find the access token");
  }

  console.log("> got user access token");

  return accessToken;
};

const getUserMembershipId = async (token) => {
  console.log("> fetching user memberships");

  const memberships = await axios.get(
    "https://embracenorth.marianatek.com/api/customer/v1/me/memberships?is_active=true&page_size=5",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!memberships.data.results.length) {
    throw new Error("no active memberships found for user");
  }

  console.log("> found user membership");

  return memberships.data.results[0].id;
};

const makeReservation = async (classId, username, password) => {
  console.log(`> booking class: ${classId}`);

  const token = await getUserAccessToken(username, password);

  const membershipId = await getUserMembershipId(token);
  try {
    await axios.post(
      "https://embracenorth.marianatek.com/api/customer/v1/me/reservations",
      {
        class_session: {
          id: classId,
        },
        is_booked_for_me: true,
        reservation_type: "standard",
        payment_option: {
          id: `membership-${membershipId}`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (e) {
    if (e.response && e.response.status === 422) {
      console.error(e.response.data);
      console.log(`> class already booked: ${classId}`);
    } else {
      throw e.response || e;
    }
  }

  console.log(`> booked class: ${classId}`);
};

module.exports = {
  getUserAccessToken,
  findOpenTime,
  makeReservation,
};
