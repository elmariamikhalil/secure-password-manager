// routes/auth.routes.js - Authentication related routes with enhanced error handling

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
    console.log(
      "Registration request received. Body:",
      JSON.stringify(req.body, null, 2)
    );

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
      console.log("Missing required fields");
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists:", email);
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

    console.log("Saving new user...");
    await newUser.save();
    console.log("User saved successfully");

    // Create audit log
    await new AuditLog({
      userId: newUser._id,
      actionType: "login",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: "Initial registration",
      status: "success",
    }).save();
    console.log("Audit log created");

    // Generate JWT
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || "default-secret-replace-in-production",
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
    console.log("Refresh token saved");

    console.log("Registration successful for:", email);
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
    console.error("Registration error details:", error);
    console.error("Stack trace:", error.stack);

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

// Rest of the code remains the same...

module.exports = router;
