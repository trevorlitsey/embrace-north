const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { encrypt } = require("../encryption");
const {
  createUser,
  getUserByUsername,
  getUserById,
  updateUser,
} = require("../db/userDb");
const { getUserAccessToken } = require("../embrace");

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Auth user & get token (authenticates against Embrace North)
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Verify credentials against Embrace North
    await getUserAccessToken(username, password);

    // Credentials valid — check if user exists in DynamoDB
    let user = await getUserByUsername(username);

    if (user) {
      // Update stored password if it changed
      const updatedUser = await updateUser(user.userId, {
        password: encrypt(password),
      });

      res.json({
        _id: updatedUser.userId,
        username: updatedUser.username,
        phoneNumber: updatedUser.phoneNumber,
        enableTextNotifications: updatedUser.enableTextNotifications,
        token: generateToken(updatedUser.userId),
      });
    } else {
      // New user — auto-create in DynamoDB
      const userId = uuidv4();
      const newUser = await createUser({
        userId,
        username,
        password: encrypt(password),
      });

      res.status(201).json({
        _id: newUser.userId,
        username: newUser.username,
        phoneNumber: newUser.phoneNumber,
        enableTextNotifications: newUser.enableTextNotifications,
        token: generateToken(newUser.userId),
      });
    }
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(401).json({ message: "Invalid Embrace North credentials" });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await getUserById(req.user.userId);

    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json({ _id: user.userId, ...userWithoutPassword });
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
    const user = await getUserById(req.user.userId);

    if (user) {
      const updates = {};

      if (req.body.password) {
        updates.password = encrypt(req.body.password);
      }

      if (req.body.phoneNumber !== undefined) {
        updates.phoneNumber = req.body.phoneNumber;
      }

      if (req.body.enableTextNotifications !== undefined) {
        updates.enableTextNotifications = req.body.enableTextNotifications;
      }

      // If phone number is empty, disable notifications
      if (updates.phoneNumber === "" || (!updates.phoneNumber && !user.phoneNumber)) {
        updates.enableTextNotifications = false;
      }

      const updatedUser = await updateUser(req.user.userId, updates);

      res.json({
        _id: updatedUser.userId,
        username: updatedUser.username,
        phoneNumber: updatedUser.phoneNumber,
        enableTextNotifications: updatedUser.enableTextNotifications,
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
  loginUser,
  getUserProfile,
  updateUserProfile,
};
