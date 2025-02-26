require("dotenv").config();
const puppeteer = require("puppeteer");
const axios = require("axios");
const { DATE, INTERVAL_IN_MINUTES, TIMES } = require("./config");

const formatAsFriendlyTime = (isoString) => {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "numeric",
    hour12: true, // 12-hour format with AM/PM
  }).format(new Date(isoString));
};

const findOpenTime = async () => {
  console.log("----------------");
  console.log(`> ${new Date()}`);
  console.log(`> checking for open times on ${DATE}`);

  const classesRes = await axios.get(
    `https://embracenorth.marianatek.com/api/customer/v1/classes?min_start_date=${DATE}&max_start_date=${DATE}&page_size=500&region=48541`
  );

  const classesWithOpenTimes = classesRes.data.results
    .filter(
      (c) =>
        c.available_spot_count > 0 &&
        TIMES.includes(formatAsFriendlyTime(c.booking_start_datetime))
    )
    .map((c) => ({
      ...c,
      friendlyTime: formatAsFriendlyTime(c.booking_start_datetime),
    }))
    .sort(
      (a, b) => TIMES.indexOf(a.friendlyTime) - TIMES.indexOf(b.friendlyTime)
    );

  if (classesWithOpenTimes.length === 0) {
    console.log(
      `> no open times found for ${TIMES.join(
        ", "
      )}. next check in ${INTERVAL_IN_MINUTES} minutes`
    );
    return;
  } else {
    console.log(
      `> open times found: ${classesWithOpenTimes
        .map((c) => c.friendlyTime)
        .join(", ")}`
    );
  }

  // initial page load
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // go to open class
  await page.goto(
    `https://embracenorth.marianaiframes.com/iframe/classes/${classesWithOpenTimes[0].id}/reserve`
  );
  await page.waitForNetworkIdle();

  // cookies
  await page.waitForSelector(`button[data-test-button="accept-all-cookies"]`);
  await page.click('button[data-test-button="accept-all-cookies"]');

  // login
  await page.waitForSelector('button[data-test-button="log-in"]');
  await page.click('button[data-test-button="log-in"]');
  await page.waitForSelector('input[name="username"]');
  await page.type('input[name="username"]', process.env.EMAIL);
  await page.type('input[name="password"]', process.env.PASSWORD);
  await page.click('button[type="submit"]');

  // confirm
  await page.waitForSelector('button[data-test-button="reserve"]');
  await page.click('button[data-test-button="reserve"]');

  await page.waitForSelector('a[data-test-button="book-another-class"]');

  console.log(`> booked class: ${classesWithOpenTimes[0].friendlyTime}`);

  // bye
  await browser.close();
  process.exit();
};

findOpenTime();

module.exports = {
  findOpenTime,
};
