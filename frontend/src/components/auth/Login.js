// frontend/src/components/auth/Login.js

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, verifyMfa } from "../../services/auth.service";

const Login = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("login"); // 'login' or 'mfa'
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    mfaCode: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [mfaData, setMfaData] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateLoginForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateMfaForm = () => {
    const newErrors = {};

    if (!formData.mfaCode) {
      newErrors.mfaCode = "MFA code is required";
    } else if (
      !/^\d{6}$/.test(formData.mfaCode) &&
      mfaData?.mfaMethod === "totp"
    ) {
      newErrors.mfaCode = "MFA code must be 6 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!validateLoginForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      // Check if MFA is required
      if (result.mfaRequired) {
        setMfaData({
          userId: result.userId,
          mfaMethod: result.mfaMethod,
        });
        setStep("mfa");
      } else {
        // Login successful, redirect to vault
        navigate("/vault");
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error.message) {
        setErrors((prev) => ({ ...prev, form: error.message }));
      } else {
        setErrors((prev) => ({
          ...prev,
          form: "Login failed. Please check your credentials.",
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();

    if (!validateMfaForm()) {
      return;
    }

    setLoading(true);

    try {
      await verifyMfa(
        mfaData.userId,
        formData.mfaCode,
        mfaData.mfaMethod,
        formData.password
      );

      // MFA verification successful, redirect to vault
      navigate("/vault");
    } catch (error) {
      console.error("MFA verification error:", error);

      if (error.message) {
        setErrors((prev) => ({ ...prev, form: error.message }));
      } else {
        setErrors((prev) => ({
          ...prev,
          form: "MFA verification failed. Please try again.",
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  // Render login form
  const renderLoginForm = () => (
    <form onSubmit={handleLoginSubmit}>
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

      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Master Password
          </label>
          <Link
            to="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Forgot Password?
          </Link>
        </div>
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
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {loading ? "Logging in..." : "Log In"}
      </button>
    </form>
  );

  // Render MFA form
  const renderMfaForm = () => (
    <form onSubmit={handleMfaSubmit}>
      <div className="mb-6">
        <label
          htmlFor="mfaCode"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {mfaData?.mfaMethod === "totp"
            ? "Authentication Code"
            : "Verification Code"}
        </label>
        <input
          type="text"
          id="mfaCode"
          name="mfaCode"
          value={formData.mfaCode}
          onChange={handleChange}
          placeholder="Enter 6-digit code"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
            errors.mfaCode
              ? "border-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-blue-500"
          }`}
        />
        {errors.mfaCode && (
          <p className="mt-1 text-sm text-red-500">{errors.mfaCode}</p>
        )}
        <p className="mt-2 text-sm text-gray-600">
          {mfaData?.mfaMethod === "totp"
            ? "Enter the code from your authenticator app."
            : `Enter the verification code sent to your ${
                mfaData?.mfaMethod === "email" ? "email" : "phone"
              }.`}
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {loading ? "Verifying..." : "Verify Code"}
      </button>

      <button
        type="button"
        onClick={() => setStep("login")}
        className="w-full mt-3 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
      >
        Back to Login
      </button>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            {step === "login" ? "Welcome Back" : "Two-Factor Authentication"}
          </h1>
          <p className="text-gray-600 mt-2">
            {step === "login"
              ? "Log in to access your secure vault"
              : "Please complete the second step of authentication"}
          </p>
        </div>

        {errors.form && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {errors.form}
          </div>
        )}

        {step === "login" ? renderLoginForm() : renderMfaForm()}

        {step === "login" && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Create Account
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
