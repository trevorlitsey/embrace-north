const Appointment = require("../models/Appointment");

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private
const createAppointment = async (req, res) => {
  try {
    const { date, times, timeFulfilled } = req.body;

    const appointment = await Appointment.create({
      date,
      times,
      timeFulfilled,
      userId: req.user.userId,
    });

    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all user appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user.userId });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
// @access  Private
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (appointment && appointment.userId === req.user.userId) {
      res.json(appointment);
    } else {
      res.status(404);
      throw new Error("Appointment not found or unauthorized");
    }
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (appointment && appointment.userId === req.user.userId) {
      appointment.date = req.body.date || appointment.date;
      appointment.times = req.body.times || appointment.times;
      appointment.timeFulfilled =
        req.body.timeFulfilled || appointment.timeFulfilled;

      const updatedAppointment = await appointment.save();
      res.json(updatedAppointment);
    } else {
      res.status(404);
      throw new Error("Appointment not found or unauthorized");
    }
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (appointment && appointment.userId === req.user.userId) {
      await appointment.remove();
      res.json({ message: "Appointment removed" });
    } else {
      res.status(404);
      throw new Error("Appointment not found or unauthorized");
    }
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
};
