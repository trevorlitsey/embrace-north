const mongoose = require("mongoose");
const { encrypt, decrypt } = require("../encryption");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    password: {
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
  try {
    if (this.isModified("password")) {
      this.password = encrypt(this.password);
    }

    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.getDecryptedPassword = function () {
  return decrypt(this.password);
};

userSchema.methods.matchPassword = async function (enteredPassword) {
  return enteredPassword === decrypt(this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
