// routes/vault.routes.js - Routes for managing vault items

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const VaultItem = require("../models/vault.model");
const AuditLog = require("../models/audit.model");
const { authMiddleware } = require("../middleware/auth.middleware");

// Apply auth middleware to all vault routes
router.use(authMiddleware);

/**
 * @route GET /api/vault
 * @description Get all vault items for the authenticated user
 * @access Private
 */
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all vault items for the user
    const vaultItems = await VaultItem.find({ userId })
      .select("_id encryptedData itemType metadata version createdAt updatedAt")
      .sort({ "metadata.lastUsed": -1 });

    // Create audit log
    await new AuditLog({
      userId,
      actionType: "access_shared",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: "Accessed vault items",
      status: "success",
    }).save();

    res.status(200).json({ vaultItems });
  } catch (error) {
    console.error("Error fetching vault items:", error);
    res.status(500).json({ message: "Failed to fetch vault items" });
  }
});

/**
 * @route GET /api/vault/domain/:domain
 * @description Get vault items for a specific domain
 * @access Private
 */
router.get("/domain/:domain", async (req, res) => {
  try {
    const userId = req.user.id;
    const { domain } = req.params;

    // Find vault items matching the domain
    const vaultItems = await VaultItem.find({
      userId,
      "metadata.domain": domain,
    }).select("_id encryptedData itemType metadata version");

    // Update lastUsed timestamp
    if (vaultItems.length > 0) {
      for (const item of vaultItems) {
        item.metadata.lastUsed = new Date();
        await item.save();
      }
    }

    res.status(200).json({ vaultItems });
  } catch (error) {
    console.error("Error fetching domain items:", error);
    res.status(500).json({ message: "Failed to fetch items for domain" });
  }
});

/**
 * @route GET /api/vault/:id
 * @description Get a specific vault item
 * @access Private
 */
router.get("/:id", async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid vault item ID" });
    }

    // Find the vault item
    const vaultItem = await VaultItem.findOne({
      _id: id,
      $or: [{ userId }, { "sharing.sharedWith.userId": userId }],
    });

    if (!vaultItem) {
      return res.status(404).json({ message: "Vault item not found" });
    }

    // Update lastUsed timestamp
    vaultItem.metadata.lastUsed = new Date();
    await vaultItem.save();

    // If this is a shared item accessed by a non-owner
    if (vaultItem.userId.toString() !== userId && vaultItem.sharing.isShared) {
      await new AuditLog({
        userId,
        actionType: "access_shared",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        resourceId: vaultItem._id,
        details: `Accessed shared item: ${
          vaultItem.metadata.name || "Unnamed"
        }`,
        status: "success",
      }).save();
    }

    res.status(200).json({ vaultItem });
  } catch (error) {
    console.error("Error fetching vault item:", error);
    res.status(500).json({ message: "Failed to fetch vault item" });
  }
});

/**
 * @route POST /api/vault
 * @description Create a new vault item
 * @access Private
 */
router.post("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const { encryptedData, itemType, metadata } = req.body;

    // Validate required fields
    if (!encryptedData) {
      return res.status(400).json({ message: "Encrypted data is required" });
    }

    // Create a new vault item
    const newVaultItem = new VaultItem({
      userId,
      encryptedData,
      itemType: itemType || "login",
      metadata: {
        ...metadata,
        lastUsed: new Date(),
      },
    });

    await newVaultItem.save();

    // Create audit log
    await new AuditLog({
      userId,
      actionType: "create_item",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      resourceId: newVaultItem._id,
      details: `Created new ${itemType || "login"} item: ${
        metadata?.name || "Unnamed"
      }`,
      status: "success",
    }).save();

    res.status(201).json({
      message: "Vault item created successfully",
      vaultItem: newVaultItem,
    });
  } catch (error) {
    console.error("Error creating vault item:", error);
    res.status(500).json({ message: "Failed to create vault item" });
  }
});

/**
 * @route PUT /api/vault/:id
 * @description Update a vault item
 * @access Private
 */
router.put("/:id", async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { encryptedData, metadata } = req.body;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid vault item ID" });
    }

    // Find the vault item
    const vaultItem = await VaultItem.findOne({
      _id: id,
      $or: [
        { userId },
        {
          "sharing.sharedWith.userId": userId,
          "sharing.sharedWith.permissions": "write",
        },
      ],
    });

    if (!vaultItem) {
      return res
        .status(404)
        .json({
          message:
            "Vault item not found or you do not have permission to update it",
        });
    }

    // Update the item
    if (encryptedData) {
      vaultItem.encryptedData = encryptedData;
    }

    if (metadata) {
      vaultItem.metadata = {
        ...vaultItem.metadata,
        ...metadata,
        lastUsed: new Date(),
      };
    }

    vaultItem.updatedAt = new Date();
    await vaultItem.save();

    // Create audit log
    await new AuditLog({
      userId,
      actionType: "update_item",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      resourceId: vaultItem._id,
      details: `Updated ${vaultItem.itemType} item: ${
        vaultItem.metadata?.name || "Unnamed"
      }`,
      status: "success",
    }).save();

    res.status(200).json({
      message: "Vault item updated successfully",
      vaultItem,
    });
  } catch (error) {
    console.error("Error updating vault item:", error);
    res.status(500).json({ message: "Failed to update vault item" });
  }
});

/**
 * @route DELETE /api/vault/:id
 * @description Delete a vault item
 * @access Private
 */
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid vault item ID" });
    }

    // Find the vault item
    const vaultItem = await VaultItem.findOne({
      _id: id,
      userId, // Only the owner can delete the item
    });

    if (!vaultItem) {
      return res
        .status(404)
        .json({
          message:
            "Vault item not found or you do not have permission to delete it",
        });
    }

    // Store item details for audit log before deletion
    const itemDetails = {
      type: vaultItem.itemType,
      name: vaultItem.metadata?.name || "Unnamed",
    };

    // Delete the item
    await VaultItem.deleteOne({ _id: id });

    // Create audit log
    await new AuditLog({
      userId,
      actionType: "delete_item",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: `Deleted ${itemDetails.type} item: ${itemDetails.name}`,
      status: "success",
    }).save();

    res.status(200).json({ message: "Vault item deleted successfully" });
  } catch (error) {
    console.error("Error deleting vault item:", error);
    res.status(500).json({ message: "Failed to delete vault item" });
  }
});

/**
 * @route POST /api/vault/share/:id
 * @description Share a vault item with another user
 * @access Private
 */
router.post("/share/:id", async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { shareWithEmail, permissions } = req.body;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid vault item ID" });
    }

    // Validate required fields
    if (!shareWithEmail) {
      return res
        .status(400)
        .json({ message: "Email of user to share with is required" });
    }

    // Find the vault item
    const vaultItem = await VaultItem.findOne({
      _id: id,
      userId, // Only the owner can share the item
    });

    if (!vaultItem) {
      return res
        .status(404)
        .json({
          message:
            "Vault item not found or you do not have permission to share it",
        });
    }

    // Find the user to share with
    const User = mongoose.model("User");
    const shareWithUser = await User.findOne({ email: shareWithEmail });

    if (!shareWithUser) {
      return res.status(404).json({ message: "User to share with not found" });
    }

    // Check if already shared with this user
    const alreadyShared = vaultItem.sharing.sharedWith.some(
      (share) => share.userId.toString() === shareWithUser._id.toString()
    );

    if (alreadyShared) {
      return res
        .status(400)
        .json({ message: "Item already shared with this user" });
    }

    // Add sharing information
    vaultItem.sharing.isShared = true;
    vaultItem.sharing.sharedWith.push({
      userId: shareWithUser._id,
      permissions: permissions || "read",
    });

    // If not already set, set the sharedBy field
    if (!vaultItem.sharing.sharedBy) {
      vaultItem.sharing.sharedBy = userId;
    }

    await vaultItem.save();

    // Create audit log
    await new AuditLog({
      userId,
      actionType: "share_item",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      resourceId: vaultItem._id,
      details: `Shared ${vaultItem.itemType} item: ${
        vaultItem.metadata?.name || "Unnamed"
      } with ${shareWithEmail}`,
      status: "success",
    }).save();

    res.status(200).json({
      message: "Vault item shared successfully",
      vaultItem,
    });
  } catch (error) {
    console.error("Error sharing vault item:", error);
    res.status(500).json({ message: "Failed to share vault item" });
  }
});

/**
 * @route DELETE /api/vault/share/:id/:userId
 * @description Remove sharing for a vault item
 * @access Private
 */
router.delete("/share/:id/:sharedUserId", async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, sharedUserId } = req.params;

    // Validate ID formats
    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(sharedUserId)
    ) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Find the vault item
    const vaultItem = await VaultItem.findOne({
      _id: id,
      userId, // Only the owner can remove sharing
    });

    if (!vaultItem) {
      return res
        .status(404)
        .json({
          message:
            "Vault item not found or you do not have permission to modify sharing",
        });
    }

    // Remove the user from sharedWith
    vaultItem.sharing.sharedWith = vaultItem.sharing.sharedWith.filter(
      (share) => share.userId.toString() !== sharedUserId
    );

    // If no more shared users, update isShared flag
    if (vaultItem.sharing.sharedWith.length === 0) {
      vaultItem.sharing.isShared = false;
    }

    await vaultItem.save();

    // Create audit log
    await new AuditLog({
      userId,
      actionType: "share_item",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      resourceId: vaultItem._id,
      details: `Removed sharing for ${vaultItem.itemType} item: ${
        vaultItem.metadata?.name || "Unnamed"
      }`,
      status: "success",
    }).save();

    res.status(200).json({
      message: "Sharing removed successfully",
      vaultItem,
    });
  } catch (error) {
    console.error("Error removing sharing:", error);
    res.status(500).json({ message: "Failed to remove sharing" });
  }
});

/**
 * @route GET /api/vault/shared/with-me
 * @description Get all items shared with the authenticated user
 * @access Private
 */
router.get("/shared/with-me", async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all vault items shared with the user
    const sharedItems = await VaultItem.find({
      "sharing.sharedWith.userId": userId,
    }).select(
      "_id encryptedData itemType metadata version createdAt updatedAt sharing"
    );

    res.status(200).json({ sharedItems });
  } catch (error) {
    console.error("Error fetching shared items:", error);
    res.status(500).json({ message: "Failed to fetch shared items" });
  }
});

/**
 * @route GET /api/vault/shared/by-me
 * @description Get all items the authenticated user has shared
 * @access Private
 */
router.get("/shared/by-me", async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all vault items the user has shared
    const sharedItems = await VaultItem.find({
      userId,
      "sharing.isShared": true,
    }).select(
      "_id encryptedData itemType metadata version createdAt updatedAt sharing"
    );

    res.status(200).json({ sharedItems });
  } catch (error) {
    console.error("Error fetching items shared by user:", error);
    res.status(500).json({ message: "Failed to fetch shared items" });
  }
});

module.exports = router;
