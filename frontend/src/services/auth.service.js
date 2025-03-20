// frontend/src/services/auth.service.js

import axios from "axios";
import {
  generateSalt,
  deriveEncryptionKey,
  generateAuthHash,
  arrayBufferToBase64,
} from "../utils/encryption";

// API base URL - should come from environment variables in a real app
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Register a new user
 * Handles the client-side encryption setup for the zero-knowledge model
 * @param {Object} userData User registration data
 * @returns {Promise} Registration result
 */
export const register = async (userData) => {
  try {
    console.log("Starting registration process");
    const { email, password, firstName, lastName, passwordHint } = userData;

    // Generate a random salt for key derivation
    const salt = generateSalt();
    const saltBase64 = arrayBufferToBase64(salt);
    console.log("Generated salt successfully");

    // Number of iterations for key derivation
    const iterations = 100000;

    // Generate master password hash for authentication (using higher iterations)
    console.log("Generating master password hash");
    const masterPasswordHash = await generateAuthHash(password, salt, 200000);

    // Derive encryption key (never sent to server)
    console.log("Deriving encryption key");
    const encryptionKey = await deriveEncryptionKey(password, salt, iterations);

    // Prepare registration data
    const registrationData = {
      email,
      password, // This will be hashed again server-side (different from encryption key)
      firstName,
      lastName,
      passwordHint,
      masterPasswordHash,
      salt: saltBase64,
      iterations,
    };

    console.log("Sending registration request to server");
    console.log("Registration payload:", {
      ...registrationData,
      password: "[REDACTED]", // Don't log the actual password
      masterPasswordHash: "[REDACTED]", // Don't log the actual hash
    });

    // Register user with backend
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registrationData),
    });

    const data = await response.json();
    console.log("Registration response status:", response.status);

    if (!response.ok) {
      console.error("Registration failed:", data);
      throw data;
    }

    console.log("Registration successful");

    // Store encryption key in secure storage
    // We use sessionStorage here so it's cleared when browser is closed
    const encryptionKeyExported = await window.crypto.subtle.exportKey(
      "raw",
      encryptionKey
    );
    sessionStorage.setItem(
      "encryptionKey",
      arrayBufferToBase64(encryptionKeyExported)
    );
    console.log("Encryption key stored in session storage");

    // If registration successful, store auth token
    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Also store salt and iterations for later key derivation
      localStorage.setItem("salt", saltBase64);
      localStorage.setItem("iterations", iterations.toString());
      console.log("Auth data stored in local storage");
    }

    return data;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

/**
 * Login user
 * Handles client-side key derivation for the zero-knowledge model
 * @param {string} email User email
 * @param {string} password User password
 * @returns {Promise} Login result
 */
export const login = async (email, password) => {
  try {
    // First request basic authentication
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    // Check if MFA is required
    if (response.data.mfaRequired) {
      return {
        mfaRequired: true,
        userId: response.data.userId,
        mfaMethod: response.data.mfaMethod,
      };
    }

    // Store authentication data
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("refreshToken", response.data.refreshToken);
    localStorage.setItem("user", JSON.stringify(response.data.user));

    // Get encryption parameters from response
    const salt = response.data.encryptionParams.salt;
    const iterations = response.data.encryptionParams.iterations;

    // Store parameters for later use
    localStorage.setItem("salt", salt);
    localStorage.setItem("iterations", iterations.toString());

    // Derive encryption key from master password
    const saltBuffer = new Uint8Array(
      atob(salt)
        .split("")
        .map((c) => c.charCodeAt(0))
    );
    const encryptionKey = await deriveEncryptionKey(
      password,
      saltBuffer,
      iterations
    );

    // Store encryption key in session storage (cleared when browser is closed)
    const encryptionKeyExported = await window.crypto.subtle.exportKey(
      "raw",
      encryptionKey
    );
    sessionStorage.setItem(
      "encryptionKey",
      arrayBufferToBase64(encryptionKeyExported)
    );

    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Login failed" };
  }
};

/**
 * Verify MFA code
 * @param {string} userId User ID
 * @param {string} mfaCode MFA code
 * @param {string} mfaMethod MFA method (totp, email, sms)
 * @param {string} password Master password (needed to derive encryption key)
 * @returns {Promise} Login result
 */
export const verifyMfa = async (userId, mfaCode, mfaMethod, password) => {
  try {
    const response = await api.post("/auth/verify-mfa", {
      userId,
      mfaCode,
      mfaMethod,
    });

    // Store authentication data
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("refreshToken", response.data.refreshToken);
    localStorage.setItem("user", JSON.stringify(response.data.user));

    // Get encryption parameters from response
    const salt = response.data.encryptionParams.salt;
    const iterations = response.data.encryptionParams.iterations;

    // Store parameters for later use
    localStorage.setItem("salt", salt);
    localStorage.setItem("iterations", iterations.toString());

    // Derive encryption key from master password
    const saltBuffer = new Uint8Array(
      atob(salt)
        .split("")
        .map((c) => c.charCodeAt(0))
    );
    const encryptionKey = await deriveEncryptionKey(
      password,
      saltBuffer,
      iterations
    );

    // Store encryption key in session storage
    const encryptionKeyExported = await window.crypto.subtle.exportKey(
      "raw",
      encryptionKey
    );
    sessionStorage.setItem(
      "encryptionKey",
      arrayBufferToBase64(encryptionKeyExported)
    );

    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "MFA verification failed" };
  }
};

/**
 * Logout user
 * Clears all stored authentication and encryption data
 * @returns {Promise} Logout result
 */
export const logout = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");

    if (refreshToken) {
      await api.post("/auth/logout", { refreshToken });
    }
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Clear auth data
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    // Clear encryption data
    sessionStorage.removeItem("encryptionKey");

    // We keep salt and iterations in case user wants to login again
  }
};

/**
 * Refresh the authentication token
 * @returns {Promise} Result with new token
 */
export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await api.post("/auth/refresh-token", {
      refreshToken,
    });

    // Store new tokens
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("refreshToken", response.data.refreshToken);

    return response.data;
  } catch (error) {
    // If refresh fails, force logout
    logout();
    throw error.response?.data || { message: "Token refresh failed" };
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  return !!token && !!user;
};

/**
 * Get current user
 * @returns {Object|null} User object or null
 */
export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

/**
 * Check if encryption key is available
 * Useful to determine if vault can be decrypted
 * @returns {boolean} Encryption key status
 */
export const isVaultAccessible = () => {
  return !!sessionStorage.getItem("encryptionKey");
};

/**
 * Request password reset
 * @param {string} email User email
 * @returns {Promise} Reset request result
 */
export const requestPasswordReset = async (email) => {
  try {
    const response = await api.post("/auth/request-password-reset", { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Password reset request failed" };
  }
};

/**
 * Handle uncaught HTTP errors globally
 * Configure API interceptor to handle token refresh and expiration
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and not already trying to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        await refreshToken();

        // Update the token in the original request
        originalRequest.headers[
          "Authorization"
        ] = `Bearer ${localStorage.getItem("token")}`;

        // Retry the original request
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Export the API instance for other services
export default api;
