// src/components/generator/PasswordGenerator.js

import React, { useState, useEffect } from "react";
import {
  FaRandom,
  FaCopy,
  FaCheckCircle,
  FaSlidersH,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import {
  generateNewPassword,
  checkPasswordStrength,
} from "../../services/vault.service";

const PasswordGenerator = () => {
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [strength, setStrength] = useState(null);

  // Password options
  const [options, setOptions] = useState({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
  });

  // Advanced options visible
  const [advancedVisible, setAdvancedVisible] = useState(false);

  // Generate password on initial load
  useEffect(() => {
    generatePassword();
  }, []);

  // Generate a new password
  const generatePassword = () => {
    const result = generateNewPassword(options);
    setPassword(result.password);
    setStrength(result.strength);
    setCopied(false);
  };

  // Copy password to clipboard
  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(password)
      .then(() => {
        setCopied(true);
        // Reset the copied status after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy password: ", err);
      });
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  // Toggle advanced options
  const toggleAdvancedOptions = () => {
    setAdvancedVisible(!advancedVisible);
  };

  // Handle option change
  const handleOptionChange = (e) => {
    const { name, value, type, checked } = e.target;

    setOptions((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : Number(value),
    }));
  };

  // Render password strength
  const renderPasswordStrength = () => {
    if (!strength) return null;

    const { score, category } = strength;

    // Determine color based on score
    let color;
    if (score < 20) color = "bg-red-500";
    else if (score < 40) color = "bg-orange-500";
    else if (score < 60) color = "bg-yellow-500";
    else if (score < 80) color = "bg-blue-500";
    else color = "bg-green-500";

    let textColor;
    if (score < 20) textColor = "text-red-600";
    else if (score < 40) textColor = "text-orange-600";
    else if (score < 60) textColor = "text-yellow-600";
    else if (score < 80) textColor = "text-blue-600";
    else textColor = "text-green-600";

    return (
      <div className="mt-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">Strength</span>
          <span className={`text-sm font-medium ${textColor}`}>{category}</span>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
        </div>
        <div className="mt-3">
          <ul className="text-sm text-gray-600">
            <li className="flex items-start mb-1">
              <span
                className={
                  strength.length >= 12 ? "text-green-500" : "text-gray-400"
                }
              >
                ✓
              </span>
              <span className="ml-2">
                Length: {password.length} characters{" "}
                {strength.length < 12 && "(12+ recommended)"}
              </span>
            </li>
            <li className="flex items-start mb-1">
              <span
                className={
                  strength.hasUppercase ? "text-green-500" : "text-gray-400"
                }
              >
                ✓
              </span>
              <span className="ml-2">Uppercase letters (A-Z)</span>
            </li>
            <li className="flex items-start mb-1">
              <span
                className={
                  strength.hasLowercase ? "text-green-500" : "text-gray-400"
                }
              >
                ✓
              </span>
              <span className="ml-2">Lowercase letters (a-z)</span>
            </li>
            <li className="flex items-start mb-1">
              <span
                className={
                  strength.hasNumbers ? "text-green-500" : "text-gray-400"
                }
              >
                ✓
              </span>
              <span className="ml-2">Numbers (0-9)</span>
            </li>
            <li className="flex items-start">
              <span
                className={
                  strength.hasSymbols ? "text-green-500" : "text-gray-400"
                }
              >
                ✓
              </span>
              <span className="ml-2">Special characters (!@#$%^&*)</span>
            </li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <FaRandom className="text-blue-600 mr-3" />
        Password Generator
      </h2>

      <div className="mb-6">
        <div className="flex">
          <div className="relative flex-grow">
            <input
              type={passwordVisible ? "text" : "password"}
              value={password}
              readOnly
              className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button
                onClick={togglePasswordVisibility}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                title={passwordVisible ? "Hide password" : "Show password"}
              >
                {passwordVisible ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <button
            onClick={copyToClipboard}
            disabled={copied}
            className={`px-4 flex items-center justify-center ${
              copied ? "bg-green-600" : "bg-blue-600 hover:bg-blue-700"
            } text-white font-medium rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors`}
            title="Copy to clipboard"
          >
            {copied ? (
              <FaCheckCircle className="mr-1" />
            ) : (
              <FaCopy className="mr-1" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="length" className="text-sm font-medium text-gray-700">
            Length: {options.length} characters
          </label>
          <button
            onClick={toggleAdvancedOptions}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center focus:outline-none"
          >
            <FaSlidersH className="mr-1" />
            {advancedVisible
              ? "Hide Advanced Options"
              : "Show Advanced Options"}
          </button>
        </div>
        <input
          type="range"
          id="length"
          name="length"
          min="8"
          max="32"
          value={options.length}
          onChange={handleOptionChange}
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>8</span>
          <span>16</span>
          <span>24</span>
          <span>32</span>
        </div>
      </div>

      {advancedVisible && (
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h3 className="text-md font-semibold text-gray-800 mb-3">
            Character Types
          </h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeUppercase"
                name="includeUppercase"
                checked={options.includeUppercase}
                onChange={handleOptionChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="includeUppercase"
                className="ml-2 text-sm text-gray-700"
              >
                Include uppercase letters (A-Z)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeLowercase"
                name="includeLowercase"
                checked={options.includeLowercase}
                onChange={handleOptionChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="includeLowercase"
                className="ml-2 text-sm text-gray-700"
              >
                Include lowercase letters (a-z)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeNumbers"
                name="includeNumbers"
                checked={options.includeNumbers}
                onChange={handleOptionChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="includeNumbers"
                className="ml-2 text-sm text-gray-700"
              >
                Include numbers (0-9)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeSymbols"
                name="includeSymbols"
                checked={options.includeSymbols}
                onChange={handleOptionChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="includeSymbols"
                className="ml-2 text-sm text-gray-700"
              >
                Include special characters (!@#$%^&*)
              </label>
            </div>
          </div>
        </div>
      )}

      {renderPasswordStrength()}

      <div className="mt-6">
        <button
          onClick={generatePassword}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
        >
          <FaRandom className="mr-2" />
          Generate New Password
        </button>
      </div>
    </div>
  );
};

export default PasswordGenerator;
