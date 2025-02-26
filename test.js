require("dotenv").config();
const connectDB = require("./server/config/db");
const Appointment = require("./server/models/Appointment");

(async () => {
  await connectDB();

  const appointments = await Appointment.find({});

  console.log(appointments);
})();
