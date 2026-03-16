const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const userRoutes = require("./routes/userRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");

const app = express();

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      const allowed = (process.env.CORS_ALLOWED_ORIGINS || "").split(",");
      if (!origin || allowed.includes("*") || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/appointments", appointmentRoutes);

app.get("/", (req, res) => {
  res.send("API is running....");
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
