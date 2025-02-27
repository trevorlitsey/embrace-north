const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const User = require("./models/User"); // User model
const Appointment = require("./models/Appointment"); // Appointment model

const app = express();
const port = 3000;
const SECRET_KEY = "your_jwt_secret"; // Store this in an environment variable in production

// Middleware
app.use(bodyParser.json());

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/appointments", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

// Signup Route - Register a new user
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash the password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Create a new user
    const newUser = new User({
      username,
      passwordHash,
    });

    // Save the user to the database
    await newUser.save();

    // Generate a JWT token after successful signup (optional)
    const token = jwt.sign(
      { id: newUser._id, username: newUser.username },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    // Respond with a success message and the token
    res.status(201).json({ message: "Signup successful", token });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Login Route - Custom JWT login (same as before)
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Compare provided password with the stored password hash
    const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      SECRET_KEY,
      {
        expiresIn: "1h",
      }
    );

    // Respond with the token
    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// JWT Middleware to verify token and protect routes
const jwtMiddleware = jwt({
  secret: "your_jwt_secret", // Use environment variable in production
  algorithms: ["HS256"],
});

// Example route using the JWT middleware
app.post("/appointments", jwtMiddleware, async (req, res) => {
  const { date, times, timeFulfilled } = req.body;
  const userId = req.userId; // Extracted from JWT

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

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
