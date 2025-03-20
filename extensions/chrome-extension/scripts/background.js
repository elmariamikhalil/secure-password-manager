// API endpoint for the password manager backend
const API_BASE_URL = "https://kael.es/api";

// Authentication functions
async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    // Store auth token and user info
    chrome.storage.local.set({
      authToken: data.token,
      refreshToken: data.refreshToken,
      user: data.user,
    });

    // Store encryption key in session storage (memory only)
    if (data.encryptionParams) {
      const salt = data.encryptionParams.salt;
      const iterations = data.encryptionParams.iterations;

      // Derive encryption key from master password
      const encryptionKey = await deriveEncryptionKey(
        password,
        salt,
        iterations
      );

      // Store in session storage
      chrome.storage.session.set({
        encryptionKey: arrayBufferToBase64(
          await window.crypto.subtle.exportKey("raw", encryptionKey)
        ),
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: error.message };
  }
}

async function logout() {
  try {
    const { refreshToken } = await chrome.storage.local.get(["refreshToken"]);

    if (refreshToken) {
      const { authToken } = await chrome.storage.local.get(["authToken"]);

      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ refreshToken }),
      });
    }

    // Clear stored data
    chrome.storage.local.remove(["authToken", "refreshToken", "user"]);
    chrome.storage.session.remove(["encryptionKey"]);

    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    // Still clear local data even if API call fails
    chrome.storage.local.remove(["authToken", "refreshToken", "user"]);
    chrome.storage.session.remove(["encryptionKey"]);
    return { success: true };
  }
}

// Vault functions
async function getCredentialsForDomain(domain) {
  try {
    // Get auth token
    const { authToken } = await chrome.storage.local.get(["authToken"]);

    if (!authToken) {
      throw new Error("Not authenticated");
    }

    // Get encryption key
    const { encryptionKey } = await chrome.storage.session.get([
      "encryptionKey",
    ]);

    if (!encryptionKey) {
      throw new Error("Encryption key not available");
    }

    // Fetch credentials from API
    const response = await fetch(`${API_BASE_URL}/vault/domain/${domain}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch credentials");
    }

    // Decrypt credentials
    const key = await importEncryptionKey(encryptionKey);
    const credentials = [];

    for (const item of data.vaultItems) {
      try {
        const decryptedData = await decryptData(item.encryptedData, key);
        credentials.push({
          id: item._id,
          ...decryptedData,
          url: decryptedData.url || "",
          username: decryptedData.username || "",
          password: decryptedData.password || "",
          notes: decryptedData.notes || "",
        });
      } catch (error) {
        console.error("Failed to decrypt item:", error);
      }
    }

    return { success: true, credentials };
  } catch (error) {
    console.error("Error fetching credentials:", error);
    return { success: false, error: error.message };
  }
}

async function addCredential(credential) {
  try {
    // Get auth token
    const { authToken } = await chrome.storage.local.get(["authToken"]);

    if (!authToken) {
      throw new Error("Not authenticated");
    }

    // Get encryption key
    const { encryptionKey } = await chrome.storage.session.get([
      "encryptionKey",
    ]);

    if (!encryptionKey) {
      throw new Error("Encryption key not available");
    }

    // Extract domain from URL
    let domain = "";
    try {
      const url = new URL(credential.url);
      domain = url.hostname;
    } catch (e) {
      domain = credential.url;
    }

    // Encrypt credential data
    const key = await importEncryptionKey(encryptionKey);
    const encryptedData = await encryptData(
      {
        url: credential.url,
        username: credential.username,
        password: credential.password,
        notes: credential.notes,
      },
      key
    );

    // Create metadata for search
    const metadata = {
      domain,
      name: credential.name || domain,
    };

    // Send to API
    const response = await fetch(`${API_BASE_URL}/vault`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        encryptedData,
        itemType: "login",
        metadata,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to save credential");
    }

    return { success: true, credential: data.vaultItem };
  } catch (error) {
    console.error("Error adding credential:", error);
    return { success: false, error: error.message };
  }
}

async function updateCredential(credential) {
  try {
    // Get auth token
    const { authToken } = await chrome.storage.local.get(["authToken"]);

    if (!authToken) {
      throw new Error("Not authenticated");
    }

    // Get encryption key
    const { encryptionKey } = await chrome.storage.session.get([
      "encryptionKey",
    ]);

    if (!encryptionKey) {
      throw new Error("Encryption key not available");
    }

    // Extract domain from URL
    let domain = "";
    try {
      const url = new URL(credential.url);
      domain = url.hostname;
    } catch (e) {
      domain = credential.url;
    }

    // Encrypt credential data
    const key = await importEncryptionKey(encryptionKey);
    const encryptedData = await encryptData(
      {
        url: credential.url,
        username: credential.username,
        password: credential.password,
        notes: credential.notes,
      },
      key
    );

    // Update metadata for search
    const metadata = {
      domain,
      name: credential.name || domain,
    };

    // Send to API
    const response = await fetch(`${API_BASE_URL}/vault/${credential.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        encryptedData,
        metadata,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update credential");
    }

    return { success: true, credential: data.vaultItem };
  } catch (error) {
    console.error("Error updating credential:", error);
    return { success: false, error: error.message };
  }
}

async function deleteCredential(id) {
  try {
    // Get auth token
    const { authToken } = await chrome.storage.local.get(["authToken"]);

    if (!authToken) {
      throw new Error("Not authenticated");
    }

    // Send to API
    const response = await fetch(`${API_BASE_URL}/vault/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete credential");
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting credential:", error);
    return { success: false, error: error.message };
  }
}

async function captureCredential(credential) {
  try {
    // Get auth token
    const { authToken } = await chrome.storage.local.get(["authToken"]);

    if (!authToken) {
      // Not logged in, can't save
      return { success: false, error: "Not authenticated" };
    }

    // Extract domain from URL
    let domain = "";
    try {
      const url = new URL(credential.url);
      domain = url.hostname;
    } catch (e) {
      domain = credential.url;
    }

    // Check if we already have this credential
    const existingCredentials = await getCredentialsForDomain(domain);

    if (existingCredentials.success && existingCredentials.credentials) {
      // Check for duplicate credentials
      const duplicate = existingCredentials.credentials.find(
        (cred) =>
          cred.username === credential.username && cred.url === credential.url
      );

      if (duplicate) {
        // If the password has changed, offer to update
        if (duplicate.password !== credential.password) {
          // Show notification to update password
          chrome.notifications.create({
            type: "basic",
            iconUrl: "/icons/icon128.png",
            title: "Password Changed",
            message: `Do you want to update the password for ${credential.username} on ${domain}?`,
            buttons: [{ title: "Update Password" }, { title: "Ignore" }],
            requireInteraction: true,
          });

          // Store credential temporarily for the notification response
          chrome.storage.local.set({
            pendingCredentialUpdate: {
              id: duplicate.id,
              credential: credential,
            },
          });
        }

        return { success: true };
      }
    }

    // It's a new credential, offer to save
    chrome.notifications.create({
      type: "basic",
      iconUrl: "/icons/icon128.png",
      title: "Save Password",
      message: `Do you want to save your password for ${credential.username} on ${domain}?`,
      buttons: [{ title: "Save Password" }, { title: "Ignore" }],
      requireInteraction: true,
    });

    // Store credential temporarily for the notification response
    chrome.storage.local.set({
      pendingCredential: credential,
    });

    return { success: true };
  } catch (error) {
    console.error("Error capturing credential:", error);
    return { success: false, error: error.message };
  }
}

// Password generation
function generatePassword(
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

  // Generate random values
  const randomValues = new Uint32Array(length);
  window.crypto.getRandomValues(randomValues);

  let password = "";
  for (let i = 0; i < length; i++) {
    password += availableChars[randomValues[i] % availableChars.length];
  }

  return password;
}

// Crypto utilities
async function deriveEncryptionKey(masterPassword, salt, iterations = 100000) {
  // Convert salt from base64 if needed
  if (typeof salt === "string") {
    salt = base64ToArrayBuffer(salt);
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
}

async function importEncryptionKey(base64Key) {
  const keyBuffer = base64ToArrayBuffer(base64Key);

  return window.crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptData(data, key) {
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

async function decryptData(encryptedData, key) {
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

// Utility functions
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Refresh token mechanism
async function refreshAuthToken() {
  try {
    const { refreshToken } = await chrome.storage.local.get(["refreshToken"]);

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to refresh token");
    }

    // Update stored tokens
    chrome.storage.local.set({
      authToken: data.token,
      refreshToken: data.refreshToken,
    });

    return { success: true, token: data.token };
  } catch (error) {
    console.error("Token refresh error:", error);
    // Clear auth data on refresh failure
    chrome.storage.local.remove(["authToken", "refreshToken", "user"]);
    return { success: false, error: error.message };
  }
}

// Handle notification clicks
chrome.notifications.onButtonClicked.addListener(
  async (notificationId, buttonIndex) => {
    if (buttonIndex === 0) {
      // First button (Save/Update)
      const { pendingCredential, pendingCredentialUpdate } =
        await chrome.storage.local.get([
          "pendingCredential",
          "pendingCredentialUpdate",
        ]);

      if (pendingCredential) {
        // Save new credential
        await addCredential(pendingCredential);
        chrome.storage.local.remove(["pendingCredential"]);
      } else if (pendingCredentialUpdate) {
        // Update existing credential
        await updateCredential({
          id: pendingCredentialUpdate.id,
          ...pendingCredentialUpdate.credential,
        });
        chrome.storage.local.remove(["pendingCredentialUpdate"]);
      }
    } else {
      // User clicked "Ignore"
      chrome.storage.local.remove([
        "pendingCredential",
        "pendingCredentialUpdate",
      ]);
    }

    chrome.notifications.clear(notificationId);
  }
);

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.action) {
        case "login":
          const loginResult = await login(message.email, message.password);
          sendResponse(loginResult);
          break;

        case "logout":
          const logoutResult = await logout();
          sendResponse(logoutResult);
          break;

        case "getCredentialsForDomain":
          const credentials = await getCredentialsForDomain(message.domain);
          sendResponse(credentials);
          break;

        case "addCredential":
          const addResult = await addCredential(message.credential);
          sendResponse(addResult);
          break;

        case "updateCredential":
          const updateResult = await updateCredential(message.credential);
          sendResponse(updateResult);
          break;

        case "deleteCredential":
          const deleteResult = await deleteCredential(message.id);
          sendResponse(deleteResult);
          break;

        case "captureCredential":
          const captureResult = await captureCredential(message.credential);
          sendResponse(captureResult);
          break;

        case "generatePassword":
          const password = generatePassword(
            message.length,
            message.includeUppercase,
            message.includeLowercase,
            message.includeNumbers,
            message.includeSymbols
          );
          sendResponse({ success: true, password });
          break;

        case "refreshToken":
          const refreshResult = await refreshAuthToken();
          sendResponse(refreshResult);
          break;

        case "openPopup":
          // This would typically be handled by the browser extension API
          // But we can store the context for when the popup opens
          chrome.storage.local.set({ activeField: message.field });
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: "Unknown action" });
      }
    } catch (error) {
      console.error(`Error handling ${message.action}:`, error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  // Return true to indicate we will send a response asynchronously
  return true;
});

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Open onboarding page
    chrome.tabs.create({
      url: "onboarding.html",
    });
  }
});

// Periodic token refresh (every 25 minutes to avoid token expiration)
setInterval(async () => {
  const { authToken } = await chrome.storage.local.get(["authToken"]);
  if (authToken) {
    refreshAuthToken();
  }
}, 25 * 60 * 1000); // 25 minutes
