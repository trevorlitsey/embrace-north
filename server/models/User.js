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
    phoneNumber: {
      type: String,
      required: false,
      validate: {
        validator: function (v) {
          // Allow empty string or 10 digits
          return !v || /^[0-9]{10}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    enableTextNotifications: {
      type: Boolean,
      default: false,
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

    // If phone number is empty, disable notifications
    if (!this.phoneNumber) {
      this.enableTextNotifications = false;
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
