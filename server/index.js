const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

// Initialize Express app
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// MongoDB connection
mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

// Schema definition
const appointmentSchema = new mongoose.Schema({
  date: String,
  times: [String],
  timeFulfilled: String,
  userId: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Model definition
const Appointment = mongoose.model("Appointment", appointmentSchema);

// CREATE - Add a new appointment
app.post("/appointments", async (req, res) => {
  const { date, times, timeFulfilled, userId } = req.body;
  try {
    const newAppointment = new Appointment({
      date,
      times,
      timeFulfilled,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await newAppointment.save();
    res.status(201).json(newAppointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ - Get all appointments
app.get("/appointments", async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.status(200).json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ - Get appointment by ID
app.get("/appointments/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.status(200).json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE - Update an appointment by ID
app.put("/appointments/:id", async (req, res) => {
  const { date, times, timeFulfilled, userId } = req.body;
  try {
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { date, times, timeFulfilled, userId, updatedAt: new Date() },
      { new: true }
    );
    if (!updatedAppointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.status(200).json(updatedAppointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE - Delete an appointment by ID
app.delete("/appointments/:id", async (req, res) => {
  try {
    const deletedAppointment = await Appointment.findByIdAndDelete(
      req.params.id
    );
    if (!deletedAppointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.status(200).json({ message: "Appointment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
