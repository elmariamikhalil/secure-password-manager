// frontend/src/utils/encryption.js

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
  try {
    // Check if Web Crypto API is available
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error(
        "Web Crypto API is not available. This application requires a secure context (HTTPS or localhost)."
      );
    }

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
  } catch (error) {
    console.error("Error deriving encryption key:", error);
    throw error;
  }
}

/**
 * Generates a random salt for key derivation
 * @returns {Uint8Array} Random salt
 */
export function generateSalt() {
  try {
    if (!window.crypto || !window.crypto.getRandomValues) {
      throw new Error("Secure random number generation is not available");
    }
    return window.crypto.getRandomValues(new Uint8Array(16));
  } catch (error) {
    console.error("Error generating salt:", error);
    throw error;
  }
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
  try {
    // Check if Web Crypto API is available
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error(
        "Web Crypto API is not available. This application requires a secure context (HTTPS or localhost)."
      );
    }

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
  } catch (error) {
    console.error("Error generating auth hash:", error);
    throw error;
  }
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
  try {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (error) {
    console.error("Error converting ArrayBuffer to Base64:", error);
    throw error;
  }
}

/**
 * Converts Base64 string to ArrayBuffer
 * @param {string} base64 - Base64 string to convert
 * @returns {Uint8Array} ArrayBuffer
 */
export function base64ToArrayBuffer(base64) {
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.error("Error converting Base64 to ArrayBuffer:", error);
    throw error;
  }
}

// Check if Web Crypto API is available and log potential issues
if (typeof window !== "undefined") {
  if (!window.crypto) {
    console.error("window.crypto is not available in this browser/environment");
  } else if (!window.crypto.subtle) {
    console.error(
      "window.crypto.subtle is not available. This might be because you're not running in a secure context (HTTPS or localhost)"
    );
  }
}
