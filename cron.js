const { findOpenTime } = require("./index");

const { DATE, INTERVAL_IN_MINUTES, TIMES } = require("./config");

setInterval(
  async () => {
    const bookedTime = await findOpenTime(DATE, TIMES);

    if (bookedTime) {
      process.exit();
    }
  },
  INTERVAL_IN_MINUTES * 60 * 1000
);
