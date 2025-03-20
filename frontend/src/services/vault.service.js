// frontend/src/services/vault.service.js

import api from "./auth.service";
import {
  encryptData,
  decryptData,
  base64ToArrayBuffer,
  generatePassword,
  analyzePasswordStrength,
} from "../utils/encryption";

/**
 * Gets the encryption key from session storage
 * @returns {Promise<CryptoKey>} The encryption key
 */
const getEncryptionKey = async () => {
  const encryptionKeyBase64 = sessionStorage.getItem("encryptionKey");

  if (!encryptionKeyBase64) {
    throw new Error("Encryption key not available. Please log in again.");
  }

  const encryptionKeyBuffer = base64ToArrayBuffer(encryptionKeyBase64);

  // Import the raw key
  return window.crypto.subtle.importKey(
    "raw",
    encryptionKeyBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

/**
 * Get all vault items
 * @returns {Promise<Array>} Decrypted vault items
 */
export const getVaultItems = async () => {
  try {
    const response = await api.get("/vault");
    const encryptedItems = response.data.vaultItems;

    // Get encryption key
    const encryptionKey = await getEncryptionKey();

    // Decrypt each item
    const decryptedItems = await Promise.all(
      encryptedItems.map(async (item) => {
        try {
          const decryptedData = await decryptData(
            item.encryptedData,
            encryptionKey
          );

          return {
            id: item._id,
            ...decryptedData,
            itemType: item.itemType,
            metadata: item.metadata,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          };
        } catch (error) {
          console.error(`Failed to decrypt item ${item._id}:`, error);

          // Return a placeholder for failed items
          return {
            id: item._id,
            failedToDecrypt: true,
            itemType: item.itemType,
            metadata: item.metadata,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          };
        }
      })
    );

    return decryptedItems;
  } catch (error) {
    console.error("Error fetching vault items:", error);
    throw error.response?.data || { message: "Failed to fetch vault items" };
  }
};

/**
 * Get vault items for a specific domain (used by browser extension)
 * @param {string} domain Domain to fetch items for
 * @returns {Promise<Array>} Decrypted vault items for the domain
 */
export const getVaultItemsByDomain = async (domain) => {
  try {
    const response = await api.get(`/vault/domain/${domain}`);
    const encryptedItems = response.data.vaultItems;

    // Get encryption key
    const encryptionKey = await getEncryptionKey();

    // Decrypt each item
    const decryptedItems = await Promise.all(
      encryptedItems.map(async (item) => {
        try {
          const decryptedData = await decryptData(
            item.encryptedData,
            encryptionKey
          );

          return {
            id: item._id,
            ...decryptedData,
            itemType: item.itemType,
            metadata: item.metadata,
          };
        } catch (error) {
          console.error(`Failed to decrypt item ${item._id}:`, error);

          // Return a placeholder for failed items
          return {
            id: item._id,
            failedToDecrypt: true,
            itemType: item.itemType,
            metadata: item.metadata,
          };
        }
      })
    );

    return decryptedItems;
  } catch (error) {
    console.error("Error fetching domain items:", error);
    throw (
      error.response?.data || { message: "Failed to fetch items for domain" }
    );
  }
};

/**
 * Get a specific vault item
 * @param {string} id Item ID
 * @returns {Promise<Object>} Decrypted vault item
 */
export const getVaultItem = async (id) => {
  try {
    const response = await api.get(`/vault/${id}`);
    const encryptedItem = response.data.vaultItem;

    // Get encryption key
    const encryptionKey = await getEncryptionKey();

    // Decrypt the item
    try {
      const decryptedData = await decryptData(
        encryptedItem.encryptedData,
        encryptionKey
      );

      return {
        id: encryptedItem._id,
        ...decryptedData,
        itemType: encryptedItem.itemType,
        metadata: encryptedItem.metadata,
        sharing: encryptedItem.sharing,
        createdAt: encryptedItem.createdAt,
        updatedAt: encryptedItem.updatedAt,
      };
    } catch (error) {
      console.error(`Failed to decrypt item ${id}:`, error);

      // Return a placeholder for failed item
      return {
        id: encryptedItem._id,
        failedToDecrypt: true,
        itemType: encryptedItem.itemType,
        metadata: encryptedItem.metadata,
        sharing: encryptedItem.sharing,
        createdAt: encryptedItem.createdAt,
        updatedAt: encryptedItem.updatedAt,
      };
    }
  } catch (error) {
    console.error("Error fetching vault item:", error);
    throw error.response?.data || { message: "Failed to fetch vault item" };
  }
};

/**
 * Create a new vault item
 * @param {Object} itemData Item data to encrypt and store
 * @param {string} itemType Type of item (login, card, identity, secure_note, document)
 * @param {Object} metadata Non-sensitive metadata for search and display
 * @returns {Promise<Object>} Created item with ID
 */
export const createVaultItem = async (itemData, itemType, metadata) => {
  try {
    // Get encryption key
    const encryptionKey = await getEncryptionKey();

    // Encrypt the item data
    const encryptedData = await encryptData(itemData, encryptionKey);

    // Send to server
    const response = await api.post("/vault", {
      encryptedData,
      itemType,
      metadata,
    });

    return {
      ...response.data.vaultItem,
      decryptedData: itemData,
    };
  } catch (error) {
    console.error("Error creating vault item:", error);
    throw error.response?.data || { message: "Failed to create vault item" };
  }
};

/**
 * Update a vault item
 * @param {string} id Item ID
 * @param {Object} itemData Updated item data
 * @param {Object} metadata Updated metadata
 * @returns {Promise<Object>} Updated item
 */
export const updateVaultItem = async (id, itemData, metadata) => {
  try {
    // Get encryption key
    const encryptionKey = await getEncryptionKey();

    // Encrypt the updated item data
    const encryptedData = await encryptData(itemData, encryptionKey);

    // Send to server
    const response = await api.put(`/vault/${id}`, {
      encryptedData,
      metadata,
    });

    return {
      ...response.data.vaultItem,
      decryptedData: itemData,
    };
  } catch (error) {
    console.error("Error updating vault item:", error);
    throw error.response?.data || { message: "Failed to update vault item" };
  }
};

/**
 * Delete a vault item
 * @param {string} id Item ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteVaultItem = async (id) => {
  try {
    const response = await api.delete(`/vault/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting vault item:", error);
    throw error.response?.data || { message: "Failed to delete vault item" };
  }
};

/**
 * Share a vault item with another user
 * @param {string} id Item ID
 * @param {string} email Email of user to share with
 * @param {string} permissions Permissions to grant (read, write)
 * @returns {Promise<Object>} Sharing result
 */
export const shareVaultItem = async (id, email, permissions = "read") => {
  try {
    const response = await api.post(`/vault/share/${id}`, {
      shareWithEmail: email,
      permissions,
    });

    return response.data;
  } catch (error) {
    console.error("Error sharing vault item:", error);
    throw error.response?.data || { message: "Failed to share vault item" };
  }
};

/**
 * Remove sharing for a vault item
 * @param {string} id Item ID
 * @param {string} sharedUserId ID of user to remove sharing for
 * @returns {Promise<Object>} Result
 */
export const removeSharing = async (id, sharedUserId) => {
  try {
    const response = await api.delete(`/vault/share/${id}/${sharedUserId}`);
    return response.data;
  } catch (error) {
    console.error("Error removing sharing:", error);
    throw error.response?.data || { message: "Failed to remove sharing" };
  }
};

/**
 * Get items shared with the current user
 * @returns {Promise<Array>} Shared items
 */
export const getSharedWithMe = async () => {
  try {
    const response = await api.get("/vault/shared/with-me");
    const encryptedItems = response.data.sharedItems;

    // Get encryption key
    const encryptionKey = await getEncryptionKey();

    // Decrypt each item
    const decryptedItems = await Promise.all(
      encryptedItems.map(async (item) => {
        try {
          const decryptedData = await decryptData(
            item.encryptedData,
            encryptionKey
          );

          return {
            id: item._id,
            ...decryptedData,
            itemType: item.itemType,
            metadata: item.metadata,
            sharing: item.sharing,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          };
        } catch (error) {
          console.error(`Failed to decrypt shared item ${item._id}:`, error);

          // Return a placeholder for failed items
          return {
            id: item._id,
            failedToDecrypt: true,
            itemType: item.itemType,
            metadata: item.metadata,
            sharing: item.sharing,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          };
        }
      })
    );

    return decryptedItems;
  } catch (error) {
    console.error("Error fetching shared items:", error);
    throw error.response?.data || { message: "Failed to fetch shared items" };
  }
};

/**
 * Get items the current user has shared with others
 * @returns {Promise<Array>} Items shared by the user
 */
export const getSharedByMe = async () => {
  try {
    const response = await api.get("/vault/shared/by-me");
    const encryptedItems = response.data.sharedItems;

    // Get encryption key
    const encryptionKey = await getEncryptionKey();

    // Decrypt each item
    const decryptedItems = await Promise.all(
      encryptedItems.map(async (item) => {
        try {
          const decryptedData = await decryptData(
            item.encryptedData,
            encryptionKey
          );

          return {
            id: item._id,
            ...decryptedData,
            itemType: item.itemType,
            metadata: item.metadata,
            sharing: item.sharing,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          };
        } catch (error) {
          console.error(`Failed to decrypt shared item ${item._id}:`, error);

          // Return a placeholder for failed items
          return {
            id: item._id,
            failedToDecrypt: true,
            itemType: item.itemType,
            metadata: item.metadata,
            sharing: item.sharing,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          };
        }
      })
    );

    return decryptedItems;
  } catch (error) {
    console.error("Error fetching shared items:", error);
    throw error.response?.data || { message: "Failed to fetch shared items" };
  }
};

/**
 * Generate a new random password
 * @param {Object} options Password generation options
 * @returns {Object} Generated password with strength analysis
 */
export const generateNewPassword = (options = {}) => {
  const password = generatePassword(
    options.length || 16,
    options.includeUppercase !== false,
    options.includeLowercase !== false,
    options.includeNumbers !== false,
    options.includeSymbols !== false
  );

  const strength = analyzePasswordStrength(password);

  return {
    password,
    strength,
  };
};

/**
 * Analyze the strength of a password
 * @param {string} password Password to analyze
 * @returns {Object} Password strength analysis
 */
export const checkPasswordStrength = (password) => {
  return analyzePasswordStrength(password);
};

export default {
  getVaultItems,
  getVaultItemsByDomain,
  getVaultItem,
  createVaultItem,
  updateVaultItem,
  deleteVaultItem,
  shareVaultItem,
  removeSharing,
  getSharedWithMe,
  getSharedByMe,
  generateNewPassword,
  checkPasswordStrength,
};
