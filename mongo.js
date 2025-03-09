require("dotenv").config();
const connectDB = require("./server/config/db");
const Appointment = require("./server/models/Appointment");
const User = require("./server/models/User");
const { bookTime, findOpenTime } = require("./index");

(async () => {
  const conn = await connectDB();

  const appointments = await Appointment.find({
    timeFulfilled: null,
  });

  console.log(`> ${appointments.length} pending appointment request(s) found`);

  for (let appointment of appointments) {
    try {
      const [classId, friendlyTime] = await findOpenTime(
        appointment.date,
        appointment.times
      );

      if (classId) {
        const user = await User.findById({ _id: appointment.userId });

        await bookTime(classId, user.username, user.getDecryptedPassword());

        appointment.timeFulfilled = friendlyTime;

        await appointment.save();
      }
    } catch (e) {
      console.error(e);
      console.error(
        `> Error attempting to book appointment ${appointment._id}`
      );
      if (appointment.errors) {
        appointment.errors.push(e.message);
      } else {
        appointment.errors = [e.message];
      }
    } finally {
      await appointment.save();
    }
  }

  conn.disconnect();
})();
