const date = "2025-02-27"; // yyyy-MM-dd to look for classes on. otherwise defaults to today

module.exports = {
  DATE: date || new Date().toISOString().split("T")[0],
  INTERVAL_IN_MINUTES: 10, // how often to check
  TIMES: ["6:00 PM", "5:45 PM", "5:30 PM", "6:15 PM"], // priority order of classes to look for
};
