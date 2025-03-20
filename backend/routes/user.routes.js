// routes/user.routes.js - Routes for user management

const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const AuditLog = require("../models/audit.model");
const { authMiddleware } = require("../middleware/auth.middleware");

// Apply auth middleware to all user routes
router.use(authMiddleware);

/**
 * @route GET /api/user/profile
 * @description Get user profile
 * @access Private
 */
router.get("/profile", async (req, res) => {
  try {
    const userId = req.user.id;

    // Find the user - exclude sensitive fields
    const user = await User.findById(userId).select(
      "-password -masterPasswordHash -salt -refreshTokens -mfaSecret"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Failed to fetch user profile" });
  }
});

/**
 * @route PUT /api/user/profile
 * @description Update user profile
 * @access Private
 */
router.put("/profile", async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, passwordHint } = req.body;

    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (passwordHint !== undefined) user.passwordHint = passwordHint;

    await user.save();

    // Create audit log
    await new AuditLog({
      userId,
      actionType: "update_profile",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      status: "success",
    }).save();

    // Return updated user - exclude sensitive fields
    const updatedUser = await User.findById(userId).select(
      "-password -masterPasswordHash -salt -refreshTokens -mfaSecret"
    );

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Failed to update user profile" });
  }
});

/**
 * @route PUT /api/user/password
 * @description Change user password
 * @access Private
 */
router.put("/password", async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      currentPassword,
      newPassword,
      newMasterPasswordHash,
      newSalt,
      newIterations,
    } = req.body;

    // Validate required fields
    if (
      !currentPassword ||
      !newPassword ||
      !newMasterPasswordHash ||
      !newSalt
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      // Log failed password change attempt
      await new AuditLog({
        userId,
        actionType: "password_change",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        status: "failure",
        details: "Current password verification failed",
      }).save();

      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update password and master password hash
    user.password = newPassword;
    user.masterPasswordHash = newMasterPasswordHash;
    user.salt = newSalt;

    if (newIterations) {
      user.iterations = newIterations;
    }

    await user.save();

    // Create audit log
    await new AuditLog({
      userId,
      actionType: "password_change",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      status: "success",
    }).save();

    // Clear all refresh tokens to force re-login on other devices
    user.refreshTokens = [];
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Failed to change password" });
  }
});

/**
 * @route PUT /api/user/mfa
 * @description Enable/disable MFA
 * @access Private
 */
router.put("/mfa", async (req, res) => {
  try {
    const userId = req.user.id;
    const { enable, method, secret, code } = req.body;

    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (enable) {
      // Enable MFA
      if (!method || !secret) {
        return res
          .status(400)
          .json({ message: "Method and secret are required" });
      }

      // Verify code if provided (for TOTP method)
      if (method === "totp" && code) {
        // In a real implementation, verify TOTP code here
        // For example: const isValid = speakeasy.totp.verify({...});
        // For now, we're skipping actual verification
      }

      user.mfaEnabled = true;
      user.mfaMethod = method;
      user.mfaSecret = secret;
    } else {
      // Disable MFA
      user.mfaEnabled = false;
      user.mfaMethod = "none";
      user.mfaSecret = null;
    }

    await user.save();

    // Create audit log
    await new AuditLog({
      userId,
      actionType: enable ? "mfa_enabled" : "mfa_disabled",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: `MFA ${enable ? "enabled" : "disabled"} (${method || "none"})`,
      status: "success",
    }).save();

    res.status(200).json({
      message: `MFA ${enable ? "enabled" : "disabled"} successfully`,
      mfaEnabled: user.mfaEnabled,
      mfaMethod: user.mfaMethod,
    });
  } catch (error) {
    console.error("Error updating MFA settings:", error);
    res.status(500).json({ message: "Failed to update MFA settings" });
  }
});

module.exports = router;
