// frontend/src/components/auth/Register.js

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../../services/auth.service";
import { analyzePasswordStrength } from "../../utils/encryption";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    passwordHint: "",
  });

  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Analyze password strength when password changes
    if (name === "password") {
      if (value.length > 0) {
        const strength = analyzePasswordStrength(value);
        setPasswordStrength(strength);
      } else {
        setPasswordStrength(null);
      }
    }

    // Check if passwords match when confirm password changes
    if (name === "confirmPassword") {
      if (value !== formData.password) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: "Passwords do not match",
        }));
      } else {
        setErrors((prev) => ({ ...prev, confirmPassword: "" }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate email
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Validate first name
    if (!formData.firstName) {
      newErrors.firstName = "First name is required";
    }

    // Validate last name
    if (!formData.lastName) {
      newErrors.lastName = "Last name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setDebugInfo("Starting registration process...");

    try {
      // Log registration attempt (hiding password for security)
      console.log("Registration attempt with data:", {
        ...formData,
        password: "[REDACTED]",
        confirmPassword: "[REDACTED]",
      });

      setDebugInfo((prev) => prev + "\nCalling register function...");

      const result = await register(formData);

      setDebugInfo((prev) => prev + "\nRegistration successful!");
      console.log("Registration successful:", result);

      navigate("/vault");
    } catch (error) {
      console.error("Registration error:", error);
      setDebugInfo(
        (prev) => prev + `\nRegistration failed: ${JSON.stringify(error)}`
      );

      // Handle different error formats
      if (error.message) {
        setErrors((prev) => ({ ...prev, form: error.message }));
      } else if (error.details) {
        setErrors((prev) => ({ ...prev, form: error.details }));
      } else if (typeof error === "string") {
        setErrors((prev) => ({ ...prev, form: error }));
      } else {
        setErrors((prev) => ({
          ...prev,
          form: "Registration failed. Please check your connection and try again.",
        }));
      }
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Create Your Account</h1>
          <p className="text-gray-600 mt-2">
            Start managing your passwords securely
          </p>
        </div>

        {errors.form && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                  errors.firstName
                    ? "border-red-500"
                    : "border-gray-300 focus:ring-2 focus:ring-blue-500"
                }`}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                  errors.lastName
                    ? "border-red-500"
                    : "border-gray-300 focus:ring-2 focus:ring-blue-500"
                }`}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                errors.email
                  ? "border-red-500"
                  : "border-gray-300 focus:ring-2 focus:ring-blue-500"
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Master Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                errors.password
                  ? "border-red-500"
                  : "border-gray-300 focus:ring-2 focus:ring-blue-500"
              }`}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}
            {renderPasswordStrength()}
            <p className="mt-1 text-xs text-gray-500">
              Your master password is used to encrypt your vault. We cannot
              access or reset it.
            </p>
          </div>

          <div className="mb-4">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm Master Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                errors.confirmPassword
                  ? "border-red-500"
                  : "border-gray-300 focus:ring-2 focus:ring-blue-500"
              }`}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="passwordHint"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Master Password Hint (Optional)
            </label>
            <input
              type="text"
              id="passwordHint"
              name="passwordHint"
              value={formData.passwordHint}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              A hint can help you remember your master password. It will be
              visible to anyone with your email address.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Log In
            </Link>
          </p>
        </div>

        {/* Debug information - remove in production */}
        {debugInfo && process.env.NODE_ENV !== "production" && (
          <div className="mt-6 p-3 bg-gray-100 rounded-md text-xs font-mono overflow-auto max-h-40">
            <p className="font-semibold">Debug Info:</p>
            <pre>{debugInfo}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
