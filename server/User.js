const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Method to compare the entered password with the hashed password stored in the database
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compareSync(password, this.passwordHash);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
