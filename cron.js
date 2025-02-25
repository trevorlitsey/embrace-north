require("dotenv").config();

const date = ""; // yyyy-MM-dd to look for classes on. otherwise defaults to today
const DATE = date || new Date().toISOString().split("T")[0];
const INTERVAL_IN_MINUTES = 30; // how often to check
const TIMES = ["7:30 PM", "6:45 PM", "7:00 PM", "7:15 PM"]; // priority order of classes to look for
const { findOpenTime } = require("./utils");

const findOpenTime = async () => {
  const openTime = findOpenTime(DATE, TIMES);

  await bookClass(openTime);

  process.exit();
};

findOpenTime();

setInterval(findOpenTime, 1000 * 60 * INTERVAL_IN_MINUTES);
