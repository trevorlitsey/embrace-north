require("dotenv").config();
const puppeteer = require("puppeteer");
const axios = require("axios");

const formatAsFriendlyTime = (isoString) => {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "numeric",
    hour12: true, // 12-hour format with AM/PM
  }).format(new Date(isoString));
};

const findOpenTime = async (date, times) => {
  console.log("----------------");
  console.log(`> ${new Date()}`);
  console.log(`> checking for open times on ${date}`);

  const classesRes = await axios.get(
    `https://embracenorth.marianatek.com/api/customer/v1/classes?min_start_date=${date}&max_start_date=${date}&page_size=500&region=48541`
  );

  const classesWithOpenTimes = classesRes.data.results
    .filter(
      (c) =>
        c.available_spot_count > 0 &&
        times.includes(formatAsFriendlyTime(c.booking_start_datetime))
    )
    .map((c) => ({
      ...c,
      friendlyTime: formatAsFriendlyTime(c.booking_start_datetime),
    }))
    .sort(
      (a, b) => times.indexOf(a.friendlyTime) - times.indexOf(b.friendlyTime)
    );

  if (classesWithOpenTimes.length === 0) {
    console.log(`> no open times found for ${times.join(", ")}.`);
    return [];
  } else {
    console.log(
      `> open times found: ${classesWithOpenTimes
        .map((c) => c.friendlyTime)
        .join(", ")}`
    );
  }

  return [classesWithOpenTimes[0].id, classesWithOpenTimes[0].friendlyTime];
};

const bookTime = async (classId, username, password) => {
  // initial page load
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // go to open class
  await page.goto(
    `https://embracenorth.marianaiframes.com/iframe/classes/${classId}/reserve`
  );
  await page.waitForNetworkIdle();

  // cookies
  await page.waitForSelector(`button[data-test-button="accept-all-cookies"]`);
  await page.click('button[data-test-button="accept-all-cookies"]');

  // login
  await page.waitForSelector('button[data-test-button="log-in"]');
  await page.click('button[data-test-button="log-in"]');
  await page.waitForSelector('input[name="username"]');
  await page.type('input[name="username"]', username);
  await page.type('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // confirm
  await page.waitForSelector('button[data-test-button="reserve"]');
  await page.click('button[data-test-button="reserve"]');

  await page.waitForSelector('a[data-test-button="book-another-class"]');

  console.log(`> booked class: ${classId}`);

  // bye
  await browser.close();
};

module.exports = {
  bookTime,
  findOpenTime,
};
