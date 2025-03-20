const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actionType: {
      type: String,
      enum: [
        "login",
        "logout",
        "password_change",
        "create_item",
        "update_item",
        "delete_item",
        "share_item",
        "access_shared",
        "failed_login",
        "mfa_enabled",
        "mfa_disabled",
        "export_vault",
      ],
      required: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      // Could refer to different collections based on actionType
    },
    details: {
      type: String,
    },
    status: {
      type: String,
      enum: ["success", "failure"],
      default: "success",
    },
  },
  {
    timestamps: true,
  }
);

// Create index for faster queries
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ actionType: 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", AuditLogSchema);

module.exports = AuditLog;
