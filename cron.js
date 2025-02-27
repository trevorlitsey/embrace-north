const { findOpenTime, bookTime } = require("./index");

const { DATE, INTERVAL_IN_MINUTES, TIMES } = require("./config");

const go = async () => {
  const [classId] = await findOpenTime(DATE, TIMES);

  if (classId) {
    await bookTime(classId, process.env.EMAIL, process.env.PASSWORD);
    process.exit();
  }
};

setInterval(go, INTERVAL_IN_MINUTES * 60 * 1000);

go();
