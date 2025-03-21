// src/components/vault/VaultItemForm.js

import React, { useState, useEffect } from "react";
import {
  FaEye,
  FaEyeSlash,
  FaRandom,
  FaTimes,
  FaLock,
  FaMobile,
  FaEnvelope,
  FaBell,
  FaKey,
  FaInfoCircle,
  FaShieldAlt,
  FaDice,
  FaClipboard,
  FaGlobe,
  FaUser,
  FaPen,
} from "react-icons/fa";
import {
  generateNewPassword,
  checkPasswordStrength,
} from "../../services/vault.service";

const VaultItemForm = ({ item, onSave, onClose }) => {
  const isEditing = !!item;

  const [formData, setFormData] = useState({
    url: "",
    name: "",
    username: "",
    password: "",
    notes: "",
    authMethod: "none",
    totpSecret: "",
    authDetails: "",
    recoveryCodesStr: "",
    authBackupEmail: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showTotpSecret, setShowTotpSecret] = useState(false);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("login");
  const [passwordGenLength, setPasswordGenLength] = useState(16);
  const [passwordGenOptions, setPasswordGenOptions] = useState({
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
  });

  // Set initial form data if editing
  useEffect(() => {
    if (item) {
      setFormData({
        url: item.url || "",
        name: item.metadata?.name || "",
        username: item.username || "",
        password: item.password || "",
        notes: item.notes || "",
        authMethod: item.authMethod || "none",
        totpSecret: item.totpSecret || "",
        authDetails: item.authDetails || "",
        recoveryCodesStr: item.recoveryCodesStr || "",
        authBackupEmail: item.authBackupEmail || "",
      });

      // Check password strength
      if (item.password) {
        setPasswordStrength(checkPasswordStrength(item.password));
      }

      // If item has auth method, show 2FA tab
      if (item.authMethod && item.authMethod !== "none") {
        setActiveTab("twofa");
      }
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }

    // Check password strength when password changes
    if (name === "password") {
      if (value) {
        setPasswordStrength(checkPasswordStrength(value));
      } else {
        setPasswordStrength(null);
      }
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setPasswordGenOptions({ ...passwordGenOptions, [name]: checked });
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowTotpSecret = () => {
    setShowTotpSecret(!showTotpSecret);
  };

  const toggleShowRecoveryCodes = () => {
    setShowRecoveryCodes(!showRecoveryCodes);
  };

  const generatePassword = () => {
    const { password, strength } = generateNewPassword({
      length: passwordGenLength,
      ...passwordGenOptions,
    });

    setFormData({ ...formData, password });
    setPasswordStrength(strength);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.url) {
      newErrors.url = "Website URL is required";
    } else {
      try {
        // Check if URL is valid by attempting to create a URL object
        new URL(formData.url);
      } catch (e) {
        newErrors.url = "Please enter a valid URL (e.g., https://example.com)";
      }
    }

    if (!formData.username) {
      newErrors.username = "Username is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    if (
      formData.authMethod === "totp" &&
      formData.totpSecret &&
      !/^[A-Z2-7]{16,}$/.test(formData.totpSecret)
    ) {
      newErrors.totpSecret =
        "TOTP secret should contain only uppercase letters and numbers 2-7";
    }

    if (
      formData.authBackupEmail &&
      !/\S+@\S+\.\S+/.test(formData.authBackupEmail)
    ) {
      newErrors.authBackupEmail = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSave(formData);
  };

  // Get auth method icon
  const getAuthMethodIcon = (method) => {
    switch (method) {
      case "totp":
        return <FaLock className="text-blue-500" />;
      case "sms":
        return <FaMobile className="text-green-500" />;
      case "email":
        return <FaEnvelope className="text-purple-500" />;
      case "push":
        return <FaBell className="text-orange-500" />;
      case "hardware":
        return <FaKey className="text-red-500" />;
      default:
        return <FaShieldAlt className="text-gray-500" />;
    }
  };

  // Render password strength indicator
  const renderPasswordStrength = () => {
    if (!passwordStrength) return null;

    const { score, category } = passwordStrength;

    // Determine color based on score
    let color;
    let textColor;
    if (score < 20) {
      color = "bg-red-500";
      textColor = "text-red-600";
    } else if (score < 40) {
      color = "bg-orange-500";
      textColor = "text-orange-600";
    } else if (score < 60) {
      color = "bg-yellow-500";
      textColor = "text-yellow-600";
    } else if (score < 80) {
      color = "bg-blue-500";
      textColor = "text-blue-600";
    } else {
      color = "bg-green-500";
      textColor = "text-green-600";
    }

    return (
      <div className="mt-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600">Strength</span>
          <span className={`text-xs font-medium ${textColor}`}>{category}</span>
        </div>
        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${color} transition-all duration-300`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
        {/* Header with tabs */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditing ? "Edit Item" : "Add Item"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              className={`py-3 px-6 font-medium text-sm flex items-center ${
                activeTab === "login"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("login")}
            >
              <FaUser className="mr-2" />
              Login
            </button>
            <button
              className={`py-3 px-6 font-medium text-sm flex items-center ${
                activeTab === "twofa"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("twofa")}
            >
              <FaShieldAlt className="mr-2" />
              Two-Factor
            </button>
            <button
              className={`py-3 px-6 font-medium text-sm flex items-center ${
                activeTab === "notes"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("notes")}
            >
              <FaPen className="mr-2" />
              Notes
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {/* Login Tab Content */}
            {activeTab === "login" && (
              <div className="space-y-4">
                {/* URL Field */}
                <div>
                  <label
                    htmlFor="url"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Website URL
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <FaGlobe />
                    </span>
                    <input
                      type="text"
                      id="url"
                      name="url"
                      value={formData.url}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none transition-colors ${
                        errors.url
                          ? "border-red-500"
                          : "border-gray-300 focus:ring-2 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  {errors.url && (
                    <p className="mt-1 text-sm text-red-500">{errors.url}</p>
                  )}
                </div>

                {/* Name Field */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Name (Optional)
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="My Account"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>

                {/* Username Field */}
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Username / Email
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <FaUser />
                    </span>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none transition-colors ${
                        errors.username
                          ? "border-red-500"
                          : "border-gray-300 focus:ring-2 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.username}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <FaRandom className="mr-1" />
                      Generate
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <FaLock />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none transition-colors ${
                        errors.password
                          ? "border-red-500"
                          : "border-gray-300 focus:ring-2 focus:ring-blue-500"
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <button
                        type="button"
                        onClick={toggleShowPassword}
                        className="text-gray-500 hover:text-gray-700 transition"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.password}
                    </p>
                  )}
                  {renderPasswordStrength()}

                  {/* Password Generator Options */}
                  <div className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">
                        Password Length: {passwordGenLength}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            generatePassword();
                          }}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                        >
                          <FaDice className="inline mr-1" />
                          Generate
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (formData.password) {
                              navigator.clipboard.writeText(formData.password);
                            }
                          }}
                          className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
                          disabled={!formData.password}
                        >
                          <FaClipboard className="inline mr-1" />
                          Copy
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="32"
                      value={passwordGenLength}
                      onChange={(e) =>
                        setPasswordGenLength(parseInt(e.target.value))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <label className="flex items-center text-xs text-gray-700">
                        <input
                          type="checkbox"
                          name="includeUppercase"
                          checked={passwordGenOptions.includeUppercase}
                          onChange={handleCheckboxChange}
                          className="mr-1 h-3 w-3"
                        />
                        Uppercase (A-Z)
                      </label>
                      <label className="flex items-center text-xs text-gray-700">
                        <input
                          type="checkbox"
                          name="includeLowercase"
                          checked={passwordGenOptions.includeLowercase}
                          onChange={handleCheckboxChange}
                          className="mr-1 h-3 w-3"
                        />
                        Lowercase (a-z)
                      </label>
                      <label className="flex items-center text-xs text-gray-700">
                        <input
                          type="checkbox"
                          name="includeNumbers"
                          checked={passwordGenOptions.includeNumbers}
                          onChange={handleCheckboxChange}
                          className="mr-1 h-3 w-3"
                        />
                        Numbers (0-9)
                      </label>
                      <label className="flex items-center text-xs text-gray-700">
                        <input
                          type="checkbox"
                          name="includeSymbols"
                          checked={passwordGenOptions.includeSymbols}
                          onChange={handleCheckboxChange}
                          className="mr-1 h-3 w-3"
                        />
                        Symbols (!@#$)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Two-Factor Authentication Tab Content */}
            {activeTab === "twofa" && (
              <div className="space-y-4">
                {/* Authentication Method */}
                <div>
                  <label
                    htmlFor="authMethod"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Two-Factor Authentication Method
                  </label>
                  <div className="relative">
                    <select
                      id="authMethod"
                      name="authMethod"
                      value={formData.authMethod || "none"}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-colors"
                    >
                      <option value="none">None</option>
                      <option value="totp">
                        Time-based OTP (Google Auth, Authy)
                      </option>
                      <option value="sms">SMS Authentication</option>
                      <option value="email">Email Authentication</option>
                      <option value="push">Push Notification</option>
                      <option value="hardware">
                        Hardware Key (YubiKey, etc.)
                      </option>
                    </select>
                  </div>
                </div>

                {/* Conditionally show fields based on selected auth method */}
                {formData.authMethod !== "none" && (
                  <>
                    {formData.authMethod === "totp" && (
                      <div>
                        <label
                          htmlFor="totpSecret"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          TOTP Secret Key
                        </label>
                        <div className="relative">
                          <input
                            type={showTotpSecret ? "text" : "password"}
                            id="totpSecret"
                            name="totpSecret"
                            value={formData.totpSecret || ""}
                            onChange={handleChange}
                            placeholder="e.g., JBSWY3DPEHPK3PXP"
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none pr-10 font-mono ${
                              errors.totpSecret
                                ? "border-red-500"
                                : "border-gray-300 focus:ring-2 focus:ring-blue-500"
                            } transition-colors`}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <button
                              type="button"
                              onClick={toggleShowTotpSecret}
                              className="text-gray-500 hover:text-gray-700 transition"
                              title={
                                showTotpSecret ? "Hide secret" : "Show secret"
                              }
                            >
                              {showTotpSecret ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                        </div>
                        {errors.totpSecret && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.totpSecret}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500 flex items-start">
                          <FaInfoCircle className="text-blue-500 mr-1 mt-0.5 flex-shrink-0" />
                          <span>
                            Enter the secret key provided when setting up 2FA.
                            This allows you to generate codes from this password
                            manager.
                          </span>
                        </p>
                      </div>
                    )}

                    {/* Authentication Details Field */}
                    {formData.authMethod !== "totp" && (
                      <div>
                        <label
                          htmlFor="authDetails"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Authentication Details
                        </label>
                        <input
                          type="text"
                          id="authDetails"
                          name="authDetails"
                          value={formData.authDetails || ""}
                          onChange={handleChange}
                          placeholder={
                            formData.authMethod === "sms"
                              ? "Phone number used for SMS codes"
                              : formData.authMethod === "email"
                              ? "Email used for verification codes"
                              : formData.authMethod === "push"
                              ? "Device or app used for push notifications"
                              : formData.authMethod === "hardware"
                              ? "Hardware key type (YubiKey, Titan, etc.)"
                              : "Enter details about this authentication method"
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        />
                      </div>
                    )}

                    {/* Recovery Codes Field */}
                    <div>
                      <label
                        htmlFor="recoveryCodesStr"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Recovery Codes
                      </label>
                      <div className="relative">
                        <textarea
                          id="recoveryCodesStr"
                          name="recoveryCodesStr"
                          rows="3"
                          value={formData.recoveryCodesStr || ""}
                          onChange={handleChange}
                          placeholder="Enter your backup/recovery codes"
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none pr-10 font-mono ${
                            showRecoveryCodes ? "" : "text-password"
                          } border-gray-300 focus:ring-2 focus:ring-blue-500 transition-colors`}
                        />
                        <div className="absolute top-2 right-2">
                          <button
                            type="button"
                            onClick={toggleShowRecoveryCodes}
                            className="text-gray-500 hover:text-gray-700 transition"
                            title={
                              showRecoveryCodes ? "Hide codes" : "Show codes"
                            }
                          >
                            {showRecoveryCodes ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Store your recovery codes in case you lose access to
                        your authentication method.
                      </p>
                    </div>

                    {/* Backup Email Field */}
                    <div>
                      <label
                        htmlFor="authBackupEmail"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Backup Email (Optional)
                      </label>
                      <input
                        type="email"
                        id="authBackupEmail"
                        name="authBackupEmail"
                        value={formData.authBackupEmail || ""}
                        onChange={handleChange}
                        placeholder="backup.email@example.com"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                          errors.authBackupEmail
                            ? "border-red-500"
                            : "border-gray-300 focus:ring-2 focus:ring-blue-500"
                        } transition-colors`}
                      />
                      {errors.authBackupEmail && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.authBackupEmail}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Notes Tab Content */}
            {activeTab === "notes" && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Secure Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows="12"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Store additional information securely here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
            >
              {isEditing ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VaultItemForm;
