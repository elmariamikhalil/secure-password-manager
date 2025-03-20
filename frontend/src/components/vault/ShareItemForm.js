// src/components/vault/ShareItemForm.js

import React, { useState } from "react";
import { FaTimes, FaShare } from "react-icons/fa";

const ShareItemForm = ({ item, onShare, onClose }) => {
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState("read");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate email
    if (!email) {
      setError("Email is required");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onShare(email, permissions);
      onClose();
    } catch (error) {
      setError(error.message || "Failed to share item. Please try again.");
    } finally {
      setLoading(false);
    }
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

        <div className="flex items-center mb-6">
          <FaShare className="text-blue-600 mr-3 text-xl" />
          <h2 className="text-2xl font-bold text-gray-800">Share Item</h2>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-md">
          <h3 className="font-semibold text-gray-800">
            {item?.metadata?.name || new URL(item?.url).hostname}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{item?.username}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Share with (Email)
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Permissions
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="read-permission"
                  name="permissions"
                  value="read"
                  checked={permissions === "read"}
                  onChange={() => setPermissions("read")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="read-permission"
                  className="ml-2 text-sm text-gray-700"
                >
                  Read-only (Can view but not edit)
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="write-permission"
                  name="permissions"
                  value="write"
                  checked={permissions === "write"}
                  onChange={() => setPermissions("write")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="write-permission"
                  className="ml-2 text-sm text-gray-700"
                >
                  Read & Write (Can view and edit)
                </label>
              </div>
            </div>
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
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Sharing..." : "Share"}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Note: Shared items remain encrypted. The recipient must have an
            account to access shared items.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShareItemForm;
