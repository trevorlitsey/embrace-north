require("dotenv").config();
const connectDB = require("./server/config/db");
const Appointment = require("./server/models/Appointment");
const User = require("./server/models/User");
const { makeReservation, findOpenTime } = require("./embrace");
const { sendBookingNotification } = require("./twilio");

(async () => {
  try {
    conn = await connectDB();

    const appointments = await Appointment.find({
      timeFulfilled: null,
      times: {
        $gte: new Date(),
      },
    });

    console.log(
      `> ${appointments.length} pending appointment request(s) found`
    );

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
          appointment.fulfilledAt = new Date();
          appointment.classIdFulfilled = classId;

          await appointment.save();
          if (user.enableTextNotifications && user.phoneNumber) {
            await sendBookingNotification(user.phoneNumber, appointment);
          }
        }
      } catch (e) {
        console.error(e);
        console.error(
          `> Error attempting to book appointment ${appointment._id}`
        );
        appointment.pollingErrors = appointment.pollingErrors || [];
        appointment.pollingErrors.push(e.message);
      }

      appointment.lastChecked = new Date();
      await appointment.save();
    }
  } catch (e) {
    console.error("The whole thing failed :(");
    console.error(e);
  } finally {
    if (conn) {
      await conn.disconnect();
    }
  }
})();
