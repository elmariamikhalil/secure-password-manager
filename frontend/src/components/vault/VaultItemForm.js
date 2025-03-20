// src/components/vault/VaultItemForm.js

import React, { useState, useEffect } from "react";
import { FaEye, FaEyeSlash, FaRandom, FaTimes } from "react-icons/fa";
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
  });

  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [errors, setErrors] = useState({});

  // Set initial form data if editing
  useEffect(() => {
    if (item) {
      setFormData({
        url: item.url || "",
        name: item.metadata?.name || "",
        username: item.username || "",
        password: item.password || "",
        notes: item.notes || "",
      });

      // Check password strength
      if (item.password) {
        setPasswordStrength(checkPasswordStrength(item.password));
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

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const generatePassword = () => {
    const { password, strength } = generateNewPassword({
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
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

  // Render password strength indicator
  const renderPasswordStrength = () => {
    if (!passwordStrength) return null;

    const { score, category } = passwordStrength;

    // Determine color based on score
    let color;
    if (score < 20) color = "bg-red-500";
    else if (score < 40) color = "bg-orange-500";
    else if (score < 60) color = "bg-yellow-500";
    else if (score < 80) color = "bg-blue-500";
    else color = "bg-green-500";

    return (
      <div className="mt-1">
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
        </div>
        <p className="text-sm mt-1">{category}</p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <FaTimes size={20} />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {isEditing ? "Edit Password" : "Add New Password"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="url"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Website URL
            </label>
            <input
              type="text"
              id="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://example.com"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                errors.url
                  ? "border-red-500"
                  : "border-gray-300 focus:ring-2 focus:ring-blue-500"
              }`}
            />
            {errors.url && (
              <p className="mt-1 text-sm text-red-500">{errors.url}</p>
            )}
          </div>

          <div className="mb-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              A friendly name to help you identify this account.
            </p>
          </div>

          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Username / Email
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="your.email@example.com"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                errors.username
                  ? "border-red-500"
                  : "border-gray-300 focus:ring-2 focus:ring-blue-500"
              }`}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-500">{errors.username}</p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none pr-20 ${
                  errors.password
                    ? "border-red-500"
                    : "border-gray-300 focus:ring-2 focus:ring-blue-500"
                }`}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="text-gray-500 hover:text-gray-700 mr-2"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="text-gray-500 hover:text-gray-700"
                  title="Generate Password"
                >
                  <FaRandom />
                </button>
              </div>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}
            {renderPasswordStrength()}
          </div>

          <div className="mb-6">
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows="3"
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isEditing ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VaultItemForm;
