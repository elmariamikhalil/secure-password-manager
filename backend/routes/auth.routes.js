// routes/auth.routes.js - Authentication related routes with enhanced error handling

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const AuditLog = require("../models/audit.model");
const { authMiddleware } = require("../middleware/auth.middleware");

/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 */
router.post("/register", async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      masterPasswordHash,
      salt,
      iterations,
      passwordHint,
    } = req.body;

    // Validate required fields
    if (!email || !password || !masterPasswordHash || !salt) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const newUser = new User({
      email,
      password, // Will be hashed by mongoose pre-save hook
      firstName,
      lastName,
      masterPasswordHash, // Client-side derived hash for the encryption key
      salt, // Client-generated salt
      iterations: iterations || 100000, // Number of iterations used in key derivation
      passwordHint,
    });

    await newUser.save();

    // Create audit log
    await new AuditLog({
      userId: newUser._id,
      actionType: "login",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: "Initial registration",
      status: "success",
    }).save();

    // Generate JWT
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || "1h" }
    );

    // Generate refresh token
    const refreshToken = crypto.randomBytes(40).toString("hex");
    const refreshExpires = new Date();
    refreshExpires.setDate(refreshExpires.getDate() + 7); // 7 days

    // Save refresh token to user
    newUser.refreshTokens.push({
      token: refreshToken,
      expires: refreshExpires,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      token,
      refreshToken,
      user: {
        id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        details: error.message,
      });
    }

    if (error.name === "MongoError" || error.name === "MongoServerError") {
      return res.status(500).json({
        message: "Database error",
        details: error.message,
      });
    }

    res.status(500).json({
      message: "Registration failed",
      details: error.message,
    });
  }
});

/**
 * @route POST /api/auth/login
 * @description Login a user
 * @access Public
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Log failed login attempt
      await new AuditLog({
        userId: user._id,
        actionType: "failed_login",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        details: "Invalid password",
        status: "failure",
      }).save();

      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if MFA is enabled
    if (user.mfaEnabled) {
      return res.status(200).json({
        mfaRequired: true,
        userId: user._id,
        mfaMethod: user.mfaMethod,
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || "1h" }
    );

    // Generate refresh token
    const refreshToken = crypto.randomBytes(40).toString("hex");
    const refreshExpires = new Date();
    refreshExpires.setDate(refreshExpires.getDate() + 7); // 7 days

    // Update user's refresh tokens
    user.refreshTokens.push({
      token: refreshToken,
      expires: refreshExpires,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create audit log
    await new AuditLog({
      userId: user._id,
      actionType: "login",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      status: "success",
    }).save();

    // Return encryption params along with auth tokens
    res.status(200).json({
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      encryptionParams: {
        salt: user.salt,
        iterations: user.iterations,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed", details: error.message });
  }
});

/**
 * @route POST /api/auth/verify-mfa
 * @description Verify MFA code
 * @access Public
 */
router.post("/verify-mfa", async (req, res) => {
  try {
    const { userId, mfaCode, mfaMethod } = req.body;

    // Validate input
    if (!userId || !mfaCode || !mfaMethod) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify MFA code logic
    let isValidMfa = false;

    if (mfaMethod === "totp") {
      // Logic to verify TOTP code
      // This would typically use a library like speakeasy
      // For demonstration, we're using a dummy verification
      isValidMfa = mfaCode.length === 6 && /^\d+$/.test(mfaCode);
    } else if (mfaMethod === "email" || mfaMethod === "sms") {
      // Logic to verify email/SMS code
      // This would check against a stored code in the database
      // For demonstration, we're using a dummy verification
      isValidMfa = mfaCode.length === 6 && /^\d+$/.test(mfaCode);
    }

    if (!isValidMfa) {
      // Log failed MFA attempt
      await new AuditLog({
        userId: user._id,
        actionType: "failed_login",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        details: "Invalid MFA code",
        status: "failure",
      }).save();

      return res.status(401).json({ message: "Invalid MFA code" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || "1h" }
    );

    // Generate refresh token
    const refreshToken = crypto.randomBytes(40).toString("hex");
    const refreshExpires = new Date();
    refreshExpires.setDate(refreshExpires.getDate() + 7); // 7 days

    // Update user's refresh tokens
    user.refreshTokens.push({
      token: refreshToken,
      expires: refreshExpires,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create audit log
    await new AuditLog({
      userId: user._id,
      actionType: "login",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: "MFA verified",
      status: "success",
    }).save();

    // Return encryption params along with auth tokens
    res.status(200).json({
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      encryptionParams: {
        salt: user.salt,
        iterations: user.iterations,
      },
    });
  } catch (error) {
    console.error("MFA verification error:", error);
    res.status(500).json({
      message: "MFA verification failed",
      details: error.message,
    });
  }
});

/**
 * @route POST /api/auth/logout
 * @description Logout user and invalidate refresh token
 * @access Private
 */
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user.id;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove refresh token
    user.refreshTokens = user.refreshTokens.filter(
      (token) => token.token !== refreshToken
    );
    await user.save();

    // Create audit log
    await new AuditLog({
      userId: user._id,
      actionType: "logout",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      status: "success",
    }).save();

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Logout failed", details: error.message });
  }
});

/**
 * @route POST /api/auth/refresh-token
 * @description Refresh authentication token
 * @access Public
 */
router.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    // Find user with this refresh token
    const user = await User.findOne({
      "refreshTokens.token": refreshToken,
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Get the specific token from user's tokens
    const tokenObj = user.refreshTokens.find(
      (token) => token.token === refreshToken
    );

    // Check if token is expired
    if (new Date() > new Date(tokenObj.expires)) {
      // Remove expired token
      user.refreshTokens = user.refreshTokens.filter(
        (token) => token.token !== refreshToken
      );
      await user.save();

      return res.status(401).json({ message: "Refresh token expired" });
    }

    // Generate new JWT
    const newToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || "1h" }
    );

    // Generate new refresh token
    const newRefreshToken = crypto.randomBytes(40).toString("hex");
    const refreshExpires = new Date();
    refreshExpires.setDate(refreshExpires.getDate() + 7); // 7 days

    // Remove old refresh token and add new one
    user.refreshTokens = user.refreshTokens.filter(
      (token) => token.token !== refreshToken
    );
    user.refreshTokens.push({
      token: newRefreshToken,
      expires: refreshExpires,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    await user.save();

    // Create audit log
    await new AuditLog({
      userId: user._id,
      actionType: "login",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: "Token refresh",
      status: "success",
    }).save();

    res.status(200).json({
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      message: "Token refresh failed",
      details: error.message,
    });
  }
});

/**
 * @route POST /api/auth/request-password-reset
 * @description Request a password reset
 * @access Public
 */
router.post("/request-password-reset", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user
    const user = await User.findOne({ email });

    // Always return success even if email not found (security best practice)
    if (!user) {
      return res.status(200).json({
        message:
          "If an account exists with that email, reset instructions will be sent",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(40).toString("hex");
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour

    // Save reset info to user
    user.accountReset = {
      requested: true,
      token: resetToken,
      expires: resetExpires,
    };

    await user.save();

    // In a real app, send an email with the reset link
    // For now, we'll just log it
    console.log(
      `Password reset link: ${
        process.env.FRONTEND_URL
      }/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`
    );

    // Create audit log
    await new AuditLog({
      userId: user._id,
      actionType: "password_change",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: "Password reset requested",
      status: "success",
    }).save();

    res.status(200).json({
      message:
        "If an account exists with that email, reset instructions will be sent",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({
      message: "Password reset request failed",
      details: error.message,
    });
  }
});

/**
 * @route POST /api/auth/reset-password
 * @description Reset password with token
 * @access Public
 */
router.post("/reset-password", async (req, res) => {
  try {
    const {
      email,
      token,
      newPassword,
      newMasterPasswordHash,
      newSalt,
      newIterations,
    } = req.body;

    // Validate required fields
    if (
      !email ||
      !token ||
      !newPassword ||
      !newMasterPasswordHash ||
      !newSalt
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify reset token
    if (
      !user.accountReset ||
      !user.accountReset.requested ||
      user.accountReset.token !== token ||
      new Date() > new Date(user.accountReset.expires)
    ) {
      return res
        .status(401)
        .json({ message: "Invalid or expired reset token" });
    }

    // Update password and encryption params
    user.password = newPassword; // Will be hashed by pre-save hook
    user.masterPasswordHash = newMasterPasswordHash;
    user.salt = newSalt;

    if (newIterations) {
      user.iterations = newIterations;
    }

    // Clear account reset data
    user.accountReset = {
      requested: false,
      token: null,
      expires: null,
    };

    // Clear all refresh tokens to force re-login on all devices
    user.refreshTokens = [];

    await user.save();

    // Create audit log
    await new AuditLog({
      userId: user._id,
      actionType: "password_change",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: "Password reset completed",
      status: "success",
    }).save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      message: "Password reset failed",
      details: error.message,
    });
  }
});

/**
 * @route GET /api/auth/password-hint
 * @description Get password hint for a user
 * @access Public
 */
router.get("/password-hint/:email", async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user
    const user = await User.findOne({ email });

    // Always return a response even if email not found (security best practice)
    if (!user || !user.passwordHint) {
      return res.status(200).json({ hint: null });
    }

    res.status(200).json({ hint: user.passwordHint });
  } catch (error) {
    console.error("Password hint retrieval error:", error);
    res.status(500).json({
      message: "Failed to retrieve password hint",
      details: error.message,
    });
  }
});

module.exports = router;
