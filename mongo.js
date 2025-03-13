require("dotenv").config();
const connectDB = require("./server/config/db");
const Appointment = require("./server/models/Appointment");
const User = require("./server/models/User");
const { makeReservation, findOpenTime } = require("./embrace");

(async () => {
  const conn = await connectDB();

  const appointments = await Appointment.find({
    timeFulfilled: null,
    times: {
      $gte: new Date(),
    },
  });

  console.log(`> ${appointments.length} pending appointment request(s) found`);

  for (let appointment of appointments) {
    try {
      const [classId, timeToBook] = await findOpenTime(appointment.times);

      if (classId) {
        const user = await User.findById({ _id: appointment.userId });

        await makeReservation(
          classId,
          user.username,
          user.getDecryptedPassword()
        );

        appointment.timeFulfilled = timeToBook;
        appointment.classIdFulfilled = classId;

        await appointment.save();
      }
    } catch (e) {
      console.error(e);
      console.error(
        `> Error attempting to book appointment ${appointment._id}`
      );
      if (appointment.pollingErrors) {
        appointment.pollingErrors.push(e.message);
      } else {
        appointment.pollingErrors = [e.message];
      }
    } finally {
      appointment.lastChecked = new Date();
      await appointment.save();
    }
  }

  conn.disconnect();
})();
