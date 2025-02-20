require("dotenv").config();
const puppeteer = require("puppeteer");

const DATE = 20;
const INTERVAL = 30;

const findOpenTime = async () => {
  console.log("----------------");
  console.log(`> ${new Date()}`);
  console.log(`> checking for open times`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(
    "https://embracenorth.marianaiframes.com/iframe/schedule/daily/48541"
  );

  await page.waitForNetworkIdle();

  // await page.click(`button[data-test-date-button="${DATE}"]`);

  await page.waitForSelector(`button[data-test-button="accept-all-cookies"]`);

  await page.click('button[data-test-button="accept-all-cookies"]');

  const table = await page.$("table");

  const openLinks = await table.evaluate(() => {
    const TIMES = ["6:45 PM", "7:00 PM", "7:15 PM"];

    const trsWithOpenTimes = [...document.querySelectorAll("tr")].filter((tr) =>
      [...tr.querySelectorAll("td")].some((td) =>
        td.textContent.includes("Reserve")
      )
    );

    return trsWithOpenTimes
      .map((tr) => {
        return [
          tr.querySelector("td").textContent.replace("60 min.Minneapolis", ""),
          tr.querySelector("td a").href,
        ];
      })
      .filter(([time]) => TIMES.includes(time));
  });

  if (openLinks.length === 0) {
    console.log(`> no open times found. next check in ${INTERVAL} minutes`);
    return;
  } else {
    console.log(`> open times found: ${openLinks.map((l) => l[0]).join(", ")}`);
  }

  await page.goto(openLinks[0][1]);

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

  await page.waitForNetworkIdle();

  await browser.close();

  throw new Error("Booked class: ", openLinks[0][0]);
};

findOpenTime();

setInterval(findOpenTime, 1000 * 60 * 30);
