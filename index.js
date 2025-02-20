const puppeteer = require("puppeteer");

// https://embracenorth.marianatek.com/auth/login

(async () => {
  const browser = await puppeteer.launch({ headless: false }); // Set to false to see the browser
  const page = await browser.newPage();
  await page.goto("https://embracenorth.com/schedule"); // Replace with your URL

  try {
    await page.waitForSelector('a[aria-label="Close"]');
    await page.$('a[aria-label="Close"]').then((el) => {
      el.click();
    });

    // Wait for the iframe to load
    await page.waitForSelector("iframe");

    // Select the iframe
    const iframeElement = await page.$("iframe");
    const iframe = await iframeElement.contentFrame();

    if (iframe) {
      // Wait for an element inside the iframe
      await iframe.waitForSelector("table"); // Replace with the actual selector
      await iframe.$("table").then(async (el) => {
        const openLinks = await el.evaluate(() => {
          const trsWithOpenTimes = [...document.querySelectorAll("tr")].filter(
            (tr) =>
              [...tr.querySelectorAll("td")].some((td) =>
                td.textContent.includes("Reserve")
              )
          );

          return trsWithOpenTimes.map((tr) => {
            return [
              tr
                .querySelector("td")
                .textContent.replace("60 min.Minneapolis", ""),
              tr.querySelector("td a").href,
            ];
          });
        });

        console.log(openLinks);
      });
      // Click the button inside the iframe
      //   await iframe.click("button#reserve");
      //   console.log("Clicked button inside iframe");
    } else {
      console.log("Iframe not found");
    }
  } catch (error) {
    console.error("Error interacting with iframe:", error);
  }

  await browser.close();
})();
