const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { userId, password, embraceNorthUserName, embraceNorthPassword } =
      req.body;

    const userExists = await User.findOne({ userId });

    if (userExists) {
      res.status(400);
      throw new Error("User already exists");
    }

    const user = await User.create({
      userId,
      password,
      embraceNorthUserName,
      embraceNorthPassword,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        userId: user.userId,
        embraceNorthUserName: user.embraceNorthUserName,
        token: generateToken(user.userId),
      });
    } else {
      res.status(400);
      throw new Error("Invalid user data");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { userId, password } = req.body;

    const user = await User.findOne({ userId });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        userId: user.userId,
        embraceNorthUserName: user.embraceNorthUserName,
        token: generateToken(user.userId),
      });
    } else {
      res.status(401);
      throw new Error("Invalid email or password");
    }
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId }).select(
      "-password -embraceNorthPassword"
    );

    if (user) {
      res.json(user);
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });

    if (user) {
      user.embraceNorthUserName =
        req.body.embraceNorthUserName || user.embraceNorthUserName;

      if (req.body.password) {
        user.password = req.body.password;
      }

      if (req.body.embraceNorthPassword) {
        user.embraceNorthPassword = req.body.embraceNorthPassword;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        userId: updatedUser.userId,
        embraceNorthUserName: updatedUser.embraceNorthUserName,
        token: generateToken(updatedUser.userId),
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
};
