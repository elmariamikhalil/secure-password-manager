// frontend/src/components/vault/VaultItem.js

import React, { useState } from "react";
import {
  FaEye,
  FaEyeSlash,
  FaCopy,
  FaEdit,
  FaTrashAlt,
  FaShareAlt,
} from "react-icons/fa";

const VaultItem = ({ item, onEdit, onDelete, onShare }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(null);

  const { id, url, username, password, notes, metadata, itemType } = item;

  // Extract domain from URL for display
  const getDomain = (url) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace("www.", "");
    } catch (e) {
      return url;
    }
  };

  // Copy text to clipboard
  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field);

      // Clear the "Copied" indicator after 2 seconds
      setTimeout(() => {
        setCopied(null);
      }, 2000);
    });
  };

  // Toggle password visibility
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Get icon or first letter for the website
  const getIcon = () => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch (e) {
      return null;
    }
  };

  // Format the date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Render favicon or placeholder
  const renderIcon = () => {
    const iconUrl = getIcon();

    if (iconUrl) {
      return (
        <img
          src={iconUrl}
          alt={getDomain(url)}
          className="w-10 h-10 rounded"
          onError={(e) => (e.target.style.display = "none")}
        />
      );
    }

    // Fallback to first letter circle
    const firstLetter = getDomain(url).charAt(0).toUpperCase();
    return (
      <div className="w-10 h-10 rounded bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
        {firstLetter}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start">
        <div className="mr-3">{renderIcon()}</div>

        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {metadata?.name || getDomain(url)}
              </h3>
              <p className="text-sm text-gray-500">{url}</p>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(item)}
                className="text-gray-500 hover:text-blue-600"
                title="Edit"
              >
                <FaEdit />
              </button>
              <button
                onClick={() => onShare(item)}
                className="text-gray-500 hover:text-green-600"
                title="Share"
              >
                <FaShareAlt />
              </button>
              <button
                onClick={() => onDelete(id)}
                className="text-gray-500 hover:text-red-600"
                title="Delete"
              >
                <FaTrashAlt />
              </button>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-1/4 text-sm text-gray-600 font-medium">
                Username
              </div>
              <div className="w-3/4 flex items-center">
                <span className="text-gray-800 mr-2">{username}</span>
                <button
                  onClick={() => copyToClipboard(username, "username")}
                  className="text-gray-500 hover:text-blue-600"
                  title="Copy username"
                >
                  <FaCopy />
                </button>
                {copied === "username" && (
                  <span className="text-xs text-green-600 ml-1">Copied!</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="w-1/4 text-sm text-gray-600 font-medium">
                Password
              </div>
              <div className="w-3/4 flex items-center">
                <span className="text-gray-800 mr-2">
                  {showPassword ? password : "••••••••••••"}
                </span>
                <button
                  onClick={toggleShowPassword}
                  className="text-gray-500 hover:text-blue-600 mr-1"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
                <button
                  onClick={() => copyToClipboard(password, "password")}
                  className="text-gray-500 hover:text-blue-600"
                  title="Copy password"
                >
                  <FaCopy />
                </button>
                {copied === "password" && (
                  <span className="text-xs text-green-600 ml-1">Copied!</span>
                )}
              </div>
            </div>

            {notes && (
              <div className="flex items-start justify-between">
                <div className="w-1/4 text-sm text-gray-600 font-medium">
                  Notes
                </div>
                <div className="w-3/4 text-gray-800">
                  <p className="whitespace-pre-wrap text-sm">{notes}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-2 border-t border-gray-100 flex justify-between text-xs text-gray-500">
            <span>Created: {formatDate(item.createdAt)}</span>
            <span>Updated: {formatDate(item.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaultItem;
