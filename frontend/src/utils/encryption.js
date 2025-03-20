// frontend/src/utils/encryption.js

/**
 * Client-side encryption utilities for the password manager
 * These functions implement the zero-knowledge encryption architecture
 * where encryption/decryption happens only on the client side
 */

/**
 * Derives encryption key from master password
 * @param {string} masterPassword - User's master password
 * @param {Uint8Array} salt - Salt for key derivation
 * @param {number} iterations - Number of PBKDF2 iterations
 * @returns {Promise<CryptoKey>} Derived encryption key
 */
export async function deriveEncryptionKey(
  masterPassword,
  salt,
  iterations = 100000
) {
  // Convert master password to buffer
  const encoder = new TextEncoder();
  const masterPasswordBuffer = encoder.encode(masterPassword);

  // Import master password as a key
  const masterPasswordKey = await window.crypto.subtle.importKey(
    "raw",
    masterPasswordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  // Derive encryption key using PBKDF2
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: iterations,
      hash: "SHA-256",
    },
    masterPasswordKey,
    { name: "AES-GCM", length: 256 },
    true, // extractable
    ["encrypt", "decrypt"]
  );

  return derivedKey;
}

/**
 * Generates a random salt for key derivation
 * @returns {Uint8Array} Random salt
 */
export function generateSalt() {
  return window.crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Generates a master password hash for authentication
 * Different from the encryption key to maintain zero-knowledge
 * @param {string} masterPassword - User's master password
 * @param {Uint8Array} salt - Salt for key derivation
 * @param {number} iterations - Number of PBKDF2 iterations
 * @returns {Promise<string>} Base64-encoded password hash
 */
export async function generateAuthHash(
  masterPassword,
  salt,
  iterations = 200000
) {
  const encoder = new TextEncoder();
  const masterPasswordBuffer = encoder.encode(masterPassword);

  // Import master password as a key
  const masterPasswordKey = await window.crypto.subtle.importKey(
    "raw",
    masterPasswordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  // Derive authentication hash
  const authBits = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: iterations,
      hash: "SHA-256",
    },
    masterPasswordKey,
    256 // 256 bits
  );

  // Convert to Base64
  return arrayBufferToBase64(authBits);
}

/**
 * Encrypts data using AES-GCM
 * @param {Object|string} data - Data to encrypt
 * @param {CryptoKey} key - Encryption key
 * @returns {Promise<string>} Base64-encoded encrypted data
 */
export async function encryptData(data, key) {
  // Convert data to string if it's an object
  const dataString = typeof data === "object" ? JSON.stringify(data) : data;

  // Convert string to buffer
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(dataString);

  // Generate random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Encrypt data
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    dataBuffer
  );

  // Combine IV and encrypted data
  const combinedBuffer = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combinedBuffer.set(iv, 0);
  combinedBuffer.set(new Uint8Array(encryptedBuffer), iv.length);

  // Convert to Base64
  return arrayBufferToBase64(combinedBuffer);
}

/**
 * Decrypts data using AES-GCM
 * @param {string} encryptedData - Base64-encoded encrypted data
 * @param {CryptoKey} key - Decryption key
 * @returns {Promise<Object|string>} Decrypted data
 */
export async function decryptData(encryptedData, key) {
  // Convert Base64 to buffer
  const encryptedBuffer = base64ToArrayBuffer(encryptedData);

  // Extract IV (first 12 bytes)
  const iv = encryptedBuffer.slice(0, 12);

  // Extract encrypted data (remaining bytes)
  const dataBuffer = encryptedBuffer.slice(12);

  // Decrypt data
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    dataBuffer
  );

  // Convert buffer to string
  const decoder = new TextDecoder();
  const decryptedString = decoder.decode(decryptedBuffer);

  // Try to parse as JSON if possible
  try {
    return JSON.parse(decryptedString);
  } catch (e) {
    // Return as string if not valid JSON
    return decryptedString;
  }
}

/**
 * Generates a random password
 * @param {number} length - Password length
 * @param {boolean} includeUppercase - Include uppercase letters
 * @param {boolean} includeLowercase - Include lowercase letters
 * @param {boolean} includeNumbers - Include numbers
 * @param {boolean} includeSymbols - Include symbols
 * @returns {string} Generated password
 */
export function generatePassword(
  length = 16,
  includeUppercase = true,
  includeLowercase = true,
  includeNumbers = true,
  includeSymbols = true
) {
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
  const numberChars = "0123456789";
  const symbolChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  let availableChars = "";

  if (includeUppercase) availableChars += uppercaseChars;
  if (includeLowercase) availableChars += lowercaseChars;
  if (includeNumbers) availableChars += numberChars;
  if (includeSymbols) availableChars += symbolChars;

  // Fallback if no character sets selected
  if (availableChars.length === 0) {
    availableChars = lowercaseChars + numberChars;
  }

  // Generate random values and map to characters
  const randomValues = new Uint32Array(length);
  window.crypto.getRandomValues(randomValues);

  let password = "";
  for (let i = 0; i < length; i++) {
    password += availableChars[randomValues[i] % availableChars.length];
  }

  return password;
}

/**
 * Analyzes password strength
 * @param {string} password - Password to analyze
 * @returns {Object} Password strength analysis
 */
export function analyzePasswordStrength(password) {
  const length = password.length;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[^A-Za-z0-9]/.test(password);

  // Count character types
  const charTypesCount = [
    hasUppercase,
    hasLowercase,
    hasNumbers,
    hasSymbols,
  ].filter(Boolean).length;

  // Calculate basic entropy (bits)
  let entropy = 0;
  if (hasUppercase) entropy += 26;
  if (hasLowercase) entropy += 26;
  if (hasNumbers) entropy += 10;
  if (hasSymbols) entropy += 33;

  // Calculate total entropy
  const totalEntropy = Math.log2(entropy) * length;

  // Detect patterns that weaken password
  const hasRepeatedChars = /(.)\\1{2,}/.test(password);
  const hasSequentialChars =
    /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(
      password
    );

  // Calculate strength score (0-100)
  let strengthScore = 0;

  // Length contribution (up to 40 points)
  strengthScore += Math.min(length * 2.5, 40);

  // Character types contribution (up to 40 points)
  strengthScore += charTypesCount * 10;

  // Penalties for patterns
  if (hasRepeatedChars) strengthScore -= 10;
  if (hasSequentialChars) strengthScore -= 10;

  // Clamp score between 0-100
  strengthScore = Math.max(0, Math.min(strengthScore, 100));

  // Determine strength category
  let strengthCategory = "";
  if (strengthScore < 20) strengthCategory = "Very Weak";
  else if (strengthScore < 40) strengthCategory = "Weak";
  else if (strengthScore < 60) strengthCategory = "Moderate";
  else if (strengthScore < 80) strengthCategory = "Strong";
  else strengthCategory = "Very Strong";

  return {
    score: strengthScore,
    category: strengthCategory,
    length,
    hasUppercase,
    hasLowercase,
    hasNumbers,
    hasSymbols,
    entropy: totalEntropy,
    hasRepeatedChars,
    hasSequentialChars,
  };
}

/**
 * Converts ArrayBuffer to Base64 string
 * @param {ArrayBuffer} buffer - Buffer to convert
 * @returns {string} Base64 string
 */
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts Base64 string to ArrayBuffer
 * @param {string} base64 - Base64 string to convert
 * @returns {Uint8Array} ArrayBuffer
 */
export function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Exports the vault data for backup
 * @param {Array} vaultItems - Encrypted vault items
 * @param {string} password - Optional password to encrypt the export
 * @returns {Promise<string>} Encrypted JSON export
 */
export async function exportVault(vaultItems, password = null) {
  const exportData = {
    version: 1,
    timestamp: new Date().toISOString(),
    items: vaultItems,
  };

  // If password provided, encrypt the export
  if (password) {
    const salt = generateSalt();
    const key = await deriveEncryptionKey(password, salt, 100000);
    const encryptedData = await encryptData(JSON.stringify(exportData), key);

    return JSON.stringify({
      encrypted: true,
      salt: arrayBufferToBase64(salt),
      data: encryptedData,
    });
  }

  // Otherwise return unencrypted (but still with encrypted vault items)
  return JSON.stringify(exportData);
}

/**
 * Imports vault data from backup
 * @param {string} importData - JSON export data
 * @param {string} password - Password to decrypt the export (if encrypted)
 * @returns {Promise<Array>} Imported vault items
 */
export async function importVault(importData, password = null) {
  let parsedData;

  try {
    parsedData = JSON.parse(importData);
  } catch (e) {
    throw new Error("Invalid import data format");
  }

  // Handle encrypted export
  if (parsedData.encrypted && password) {
    const salt = base64ToArrayBuffer(parsedData.salt);
    const key = await deriveEncryptionKey(password, salt, 100000);

    try {
      const decryptedData = await decryptData(parsedData.data, key);
      return JSON.parse(decryptedData).items;
    } catch (e) {
      throw new Error("Incorrect password or corrupted data");
    }
  } else if (parsedData.encrypted) {
    throw new Error("Password required to decrypt this export");
  }

  // Handle unencrypted export
  if (parsedData.items && Array.isArray(parsedData.items)) {
    return parsedData.items;
  }

  throw new Error("Invalid vault data format");
}
