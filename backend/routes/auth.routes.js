// routes/auth.routes.js - Authentication related routes

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
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
      iterations, // Number of iterations used in key derivation
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
      { expiresIn: process.env.JWT_EXPIRATION }
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
    res.status(500).json({ message: "Registration failed" });
  }
});

/**
 * @route POST /api/auth/login
 * @description Login user
 * @access Public
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Log failed login attempt
      await new AuditLog({
        userId: user._id,
        actionType: "failed_login",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        status: "failure",
      }).save();

      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Handle MFA if enabled
    if (user.mfaEnabled) {
      return res.status(200).json({
        message: "MFA required",
        mfaRequired: true,
        userId: user._id,
        mfaMethod: user.mfaMethod,
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    // Generate refresh token
    const refreshToken = crypto.randomBytes(40).toString("hex");
    const refreshExpires = new Date();
    refreshExpires.setDate(refreshExpires.getDate() + 7); // 7 days

    // Save refresh token to user
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

    // Get user's encryption parameters needed for client-side key derivation
    res.status(200).json({
      message: "Login successful",
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
    res.status(500).json({ message: "Login failed" });
  }
});

/**
 * @route POST /api/auth/refresh-token
 * @description Refresh JWT token
 * @access Public
 */
router.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Find user with this refresh token
    const user = await User.findOne({
      "refreshTokens.token": refreshToken,
      "refreshTokens.expires": { $gt: new Date() },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Remove the used refresh token
    user.refreshTokens = user.refreshTokens.filter(
      (token) => token.token !== refreshToken
    );

    // Generate new JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    // Generate new refresh token
    const newRefreshToken = crypto.randomBytes(40).toString("hex");
    const refreshExpires = new Date();
    refreshExpires.setDate(refreshExpires.getDate() + 7); // 7 days

    // Save new refresh token
    user.refreshTokens.push({
      token: newRefreshToken,
      expires: refreshExpires,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    await user.save();

    res.status(200).json({
      message: "Token refreshed",
      token,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ message: "Token refresh failed" });
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

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove the refresh token
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

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Logout failed" });
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

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify MFA code based on method
    let isValid = false;

    if (mfaMethod === "totp") {
      // Implement TOTP verification logic here
      // For example, using speakeasy library
      // isValid = speakeasy.totp.verify({...});
      isValid = true; // Placeholder, replace with actual verification
    } else if (mfaMethod === "email" || mfaMethod === "sms") {
      // Verify against stored code
      // isValid = user.mfaCode === mfaCode;
      isValid = true; // Placeholder, replace with actual verification
    }

    if (!isValid) {
      return res.status(400).json({ message: "Invalid MFA code" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    // Generate refresh token
    const refreshToken = crypto.randomBytes(40).toString("hex");
    const refreshExpires = new Date();
    refreshExpires.setDate(refreshExpires.getDate() + 7); // 7 days

    // Save refresh token to user
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

    res.status(200).json({
      message: "MFA verification successful",
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
    res.status(500).json({ message: "MFA verification failed" });
  }
});

/**
 * @route POST /api/auth/request-password-reset
 * @description Request password reset email
 * @access Public
 */
router.post("/request-password-reset", async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not
      return res
        .status(200)
        .json({
          message: "If user exists, a password reset email will be sent",
        });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour

    // Save to user
    user.accountReset = {
      requested: true,
      token: resetToken,
      expires: resetExpires,
    };

    await user.save();

    // Send email with reset link (implement email sending logic)
    // In a real implementation, you would integrate with SendGrid, AWS SES, etc.

    // For now, just log the token (in production, you would NEVER do this)
    console.log(`Reset token for ${email}: ${resetToken}`);

    res
      .status(200)
      .json({ message: "If user exists, a password reset email will be sent" });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({ message: "Password reset request failed" });
  }
});

module.exports = router;
