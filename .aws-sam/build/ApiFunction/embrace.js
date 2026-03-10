const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

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

module.exports = {
  getUserAccessToken,
};
