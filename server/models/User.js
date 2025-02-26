const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    embraceNorthUserName: {
      type: String,
      required: true,
      trim: true,
    },
    embraceNorthPassword: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (
    !this.isModified("password") &&
    !this.isModified("embraceNorthPassword")
  ) {
    return next();
  }

  try {
    if (this.isModified("password")) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }

    if (this.isModified("embraceNorthPassword")) {
      const salt = await bcrypt.genSalt(10);
      this.embraceNorthPassword = await bcrypt.hash(
        this.embraceNorthPassword,
        salt
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password validity
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
