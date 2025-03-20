const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    masterPasswordHash: {
      type: String,
      required: true,
    },
    salt: {
      type: String,
      required: true,
    },
    iterations: {
      type: Number,
      default: 100000,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaMethod: {
      type: String,
      enum: ["none", "totp", "sms", "email"],
      default: "none",
    },
    mfaSecret: {
      type: String,
    },
    lastLogin: {
      type: Date,
    },
    passwordHint: {
      type: String,
    },
    accountReset: {
      requested: {
        type: Boolean,
        default: false,
      },
      token: {
        type: String,
      },
      expires: {
        type: Date,
      },
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    refreshTokens: [
      {
        token: String,
        expires: Date,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        userAgent: String,
        ipAddress: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Password hashing middleware
UserSchema.pre("save", async function (next) {
  const user = this;

  // Only hash the password if it's modified or new
  if (!user.isModified("password")) return next();

  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);

    // Hash the password with the salt
    const hash = await bcrypt.hash(user.password, salt);

    // Replace the plaintext password with the hash
    user.password = hash;
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", UserSchema);

module.exports = User;
