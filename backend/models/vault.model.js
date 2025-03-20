const mongoose = require("mongoose");

const VaultItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The encrypted data blob (encrypted client-side)
    encryptedData: {
      type: String,
      required: true,
    },
    // Type helps with UI display without decrypting
    itemType: {
      type: String,
      enum: ["login", "card", "identity", "secure_note", "document"],
      default: "login",
    },
    // Non-sensitive metadata to enable search without decryption
    // These fields don't contain actual sensitive data
    metadata: {
      domain: String, // For logins, domain name only, not the full URL
      name: String, // Non-sensitive name for the item
      favorite: {
        type: Boolean,
        default: false,
      },
      color: String,
      tags: [String],
      lastUsed: Date,
    },
    // Version allows for handling encryption format changes
    version: {
      type: Number,
      default: 1,
    },
    // Shared item tracking
    sharing: {
      isShared: {
        type: Boolean,
        default: false,
      },
      sharedWith: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          permissions: {
            type: String,
            enum: ["read", "write"],
            default: "read",
          },
          sharedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      sharedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for faster queries
VaultItemSchema.index({ userId: 1, "metadata.domain": 1 });
VaultItemSchema.index({ userId: 1, itemType: 1 });

const VaultItem = mongoose.model("VaultItem", VaultItemSchema);

module.exports = VaultItem;
