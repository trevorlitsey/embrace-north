const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

const URL = "https://embracenorth.com/schedule";

async function checkReservations() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(URL);

  page.$("body").then(async (el) => {
    // console.log(await page.content());
  });
  await page.waitForSelector("iframe", {
    timeout: 10000,
  });
  page.$("iframe").then(async (el) => {
    const html = await el.evaluate(() => {
      return document.querySelector("body");
    });

    console.log(html);

    await el.waitForSelector("table", {
      timeout: 10000,
    });
    el.$("table").then((el) => el.getProperties());
    console.log(await page.content());
  });

  //   console.log("table found");

  //   await page.waitForSelector("tr td section", {
  //     timeout: 10000,
  //   });

  //   page.$("tr td section").then((el) => {
  //     console.log(el);
  //   });
}

// Initial check
checkReservations();
