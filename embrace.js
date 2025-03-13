require("dotenv").config();
const puppeteer = require("puppeteer");
const axios = require("axios");
const { DateTime } = require("luxon");

const findOpenTime = async (times) => {
  const date = DateTime.fromJSDate(times[0])
    .setZone("America/Chicago")
    .toFormat("yyyy-MM-dd");

  console.log("----------------");
  console.log(
    `> ${DateTime.now()
      .setZone("America/Chicago")
      .toFormat("yyyy-MM-dd h:mm a")}`
  );
  console.log(`> checking for open times for ${date}`);

  const classesRes = await axios.get(
    `https://embracenorth.marianatek.com/api/customer/v1/classes?min_start_date=${date}&max_start_date=${date}&page_size=500&region=48541`
  );

  const classesWithOpenTimes = classesRes.data.results
    .filter(
      (c) =>
        c.available_spot_count > 0 &&
        times.some((t) => {
          return DateTime.fromJSDate(t).equals(
            DateTime.fromISO(c.start_datetime)
          );
        })
    )
    .sort(
      (a, b) =>
        times.findIndex((t) =>
          DateTime.fromJSDate(t).equals(DateTime.fromISO(a.start_datetime))
        ) -
        times.findIndex((t) =>
          DateTime.fromJSDate(t).equals(DateTime.fromISO(b.start_datetime))
        )
    );

  if (classesWithOpenTimes.length === 0) {
    console.log(
      `> no open times found for ${times
        .map((t) =>
          DateTime.fromJSDate(t)
            .setZone("America/Chicago")
            .toFormat("yyyy-MM-dd h:mm a")
        )
        .join(", ")}.`
    );
    return [];
  } else {
    console.log(
      `> open times found: ${classesWithOpenTimes
        .map((c) =>
          DateTime.fromISO(c.start_datetime)
            .setZone("America/Chicago")
            .toFormat("yyyy-MM-dd h:mm a")
        )
        .join(", ")}`
    );
  }

  return [classesWithOpenTimes[0].id, classesWithOpenTimes[0].start_datetime];
};

const getUserAccessToken = async (username, password) => {
  console.log("> fetching user token");

  const browser = await puppeteer.launch({
    headless: true,
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

  await page.waitForNetworkIdle();

  let n = 0;
  while (n < 10 && !accessToken) {
    await new Promise((res) => setTimeout(res, 1000));
    n++;
  }

  if (!accessToken) {
    throw new Error("Could not find the access token");
  }

  await browser.close();

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
    if (e.response.status === 422) {
      // class already booked
      console.error(e.response.data);
      console.log(`> class already booked: ${classId}`);
    } else {
      throw e.response || error;
    }
  }

  console.log(`> booked class: ${classId}`);
};

module.exports = {
  getUserAccessToken,
  findOpenTime,
  makeReservation,
};
