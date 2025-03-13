const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    times: {
      type: [Date],
      required: true,
    },
    timeFulfilled: {
      type: Date,
      default: null,
    },
    classIdFulfilled: {
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
