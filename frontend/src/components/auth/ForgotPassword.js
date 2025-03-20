// src/components/auth/ForgotPassword.js

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../../services/auth.service";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await requestPasswordReset(email);
      setMessage(
        "If an account exists with that email, password reset instructions have been sent."
      );
      setSubmitted(true);
    } catch (error) {
      setError(
        error.message || "Failed to request password reset. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Forgot Password</h1>
          <p className="text-gray-600 mt-2">
            {!submitted
              ? "Enter your email to receive password reset instructions"
              : "Check your email for reset instructions"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {message}
          </div>
        )}

        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-2 text-sm text-gray-500">
                We'll send instructions to reset your master password.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Instructions"}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="mb-6 text-gray-600">
              If you don't receive an email, check your spam folder or try
              again.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setEmail("");
                setMessage("");
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Log In
            </Link>
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            Note: If you have forgotten your master password, we cannot recover
            your actual vault data due to our zero-knowledge encryption. You'll
            need to create a new vault.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
