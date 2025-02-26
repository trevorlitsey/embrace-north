const { findOpenTime } = require("./index");

const { INTERVAL_IN_MINUTES } = require("./config");

setInterval(findOpenTime, INTERVAL_IN_MINUTES * 60 * 1000);
