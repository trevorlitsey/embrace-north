const { v4: uuidv4 } = require("uuid");
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

const lambdaClient = new LambdaClient({});

const triggerCronCheck = () => {
  if (!process.env.CRON_FUNCTION_NAME) return;
  lambdaClient
    .send(new InvokeCommand({
      FunctionName: process.env.CRON_FUNCTION_NAME,
      InvocationType: "Event",
    }))
    .catch((err) => console.error("Failed to trigger cron check:", err));
};
const {
  createAppointment,
  getAppointmentsByUserId,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
} = require("../db/appointmentDb");

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private
const createAppointmentHandler = async (req, res) => {
  try {
    const { times, autoBook = true, minSpots = 1 } = req.body;

    const appointment = await createAppointment({
      userId: req.user.userId,
      appointmentId: uuidv4(),
      times: times.sort(),
      autoBook,
      minSpots: parseInt(minSpots, 10) || 1,
    });

    res.status(201).json({ _id: appointment.appointmentId, ...appointment });
    triggerCronCheck();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all user appointments
// @route   GET /api/appointments
// @access  Private
const getAppointmentsHandler = async (req, res) => {
  try {
    const appointments = await getAppointmentsByUserId(req.user.userId);
    // Sort by createdAt descending
    appointments.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    res.json(appointments.map((a) => ({ _id: a.appointmentId, ...a })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
// @access  Private
const getAppointmentByIdHandler = async (req, res) => {
  try {
    const appointment = await getAppointmentById(
      req.user.userId,
      req.params.id
    );

    if (appointment) {
      res.json({ _id: appointment.appointmentId, ...appointment });
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
const updateAppointmentHandler = async (req, res) => {
  try {
    const appointment = await getAppointmentById(
      req.user.userId,
      req.params.id
    );

    if (appointment) {
      const updates = {};
      if (req.body.times) {
        updates.times = req.body.times.sort();
      }
      if (req.body.autoBook !== undefined) {
        updates.autoBook = req.body.autoBook;
      }
      if (req.body.minSpots !== undefined) {
        updates.minSpots = parseInt(req.body.minSpots, 10) || 1;
      }

      const updatedAppointment = await updateAppointment(
        req.user.userId,
        req.params.id,
        updates
      );
      res.json({ _id: updatedAppointment.appointmentId, ...updatedAppointment });
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
const deleteAppointmentHandler = async (req, res) => {
  try {
    const appointment = await getAppointmentById(
      req.user.userId,
      req.params.id
    );

    if (appointment) {
      await deleteAppointment(req.user.userId, req.params.id);
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
  createAppointment: createAppointmentHandler,
  getAppointments: getAppointmentsHandler,
  getAppointmentById: getAppointmentByIdHandler,
  updateAppointment: updateAppointmentHandler,
  deleteAppointment: deleteAppointmentHandler,
};
