const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

const URL = "https://embracenorth.com/schedule";

async function checkReservations() {
  try {
    const response = await axios.get(URL);
    const $ = cheerio.load(response.data);
    console.log($("tr td section").text());

    $("td").each(async (index, element) => {
      const availabilityText = $(element)
        .find("p.BoldLabel-sc-ha1dsk.StyledNoWrapLabel-sc-6b5x4x.OsbvA")
        .text();
      const reserveButton = $(element)
        .next()
        .find('a[data-test-button^="reserve-"]')
        .attr("href");

      if (availabilityText.includes("Open") && reserveButton) {
        console.log("Reservation available:", availabilityText);
        await clickReserveButton(reserveButton);
      }
    });
  } catch (error) {
    console.error("Error fetching the page:", error.message);
  }
}

async function clickReserveButton(reserveUrl) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`https://embracenorth.com${reserveUrl}`);

  try {
    await page.waitForSelector(
      'button[data-test-button="confirm-reservation"]',
      { timeout: 5000 }
    );
    await page.click('button[data-test-button="confirm-reservation"]');
    console.log("Successfully clicked reservation button!");
  } catch (error) {
    console.error("Error clicking reservation button:", error.message);
  }

  await browser.close();
}

// Check every 5 minutes
setInterval(checkReservations, 5 * 60 * 1000);

// Initial check
checkReservations();
