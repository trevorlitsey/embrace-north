require("dotenv").config();
const connectDB = require("./server/config/db");
const Appointment = require("./server/models/Appointment");
const { findOpenTime } = require("./index");

(async () => {
  const conn = await connectDB();

  const appointments = await Appointment.find({
    timeFulfilled: null,
  });

  for (let appointment of appointments) {
    const bookedTime = findOpenTime(appointment.date, appointment.times);

    if (bookedTime) {
      appointments[0].updateOne({
        timeFulfilled: bookedTime,
      });
    }
  }

  conn.disconnect();
})();
