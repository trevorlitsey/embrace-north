const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
    },
    times: {
      type: [String],
      required: true,
    },
    timeFulfilled: {
      type: String,
      default: null,
    },
    pollingErrors: {
      type: [String],
      default: [],
    },
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    lastChecked: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
