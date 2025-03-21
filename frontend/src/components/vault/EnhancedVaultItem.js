// src/components/vault/EnhancedVaultItem.js

import React, { useState } from "react";
import {
  FaEye,
  FaEyeSlash,
  FaCopy,
  FaEdit,
  FaTrashAlt,
  FaShareAlt,
  FaExternalLinkAlt,
  FaLock,
  FaRegClock,
  FaKey,
} from "react-icons/fa";
import { useToast } from "../common/Toast";

const EnhancedVaultItem = ({ item, onEdit, onDelete, onShare }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showTotpCode, setShowTotpCode] = useState(false);
  const [copied, setCopied] = useState(null);
  const toast = useToast();

  const {
    id,
    url,
    username,
    password,
    notes,
    metadata,
    itemType,
    createdAt,
    updatedAt,
    authMethod,
    totpSecret,
    authDetails,
  } = item;

  // Extract domain from URL for display
  const getDomain = (url) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace("www.", "");
    } catch (e) {
      return url;
    }
  };

  // Open URL in new tab
  const openWebsite = () => {
    try {
      window.open(url, "_blank");
    } catch (e) {
      toast.error("Unable to open URL");
    }
  };

  // Copy text to clipboard
  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field);
      toast.success(`${field} copied to clipboard`);

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

  // Toggle TOTP code visibility
  const toggleShowTotpCode = () => {
    setShowTotpCode(!showTotpCode);
  };

  // Get icon or first letter for the website
  const getFavicon = () => {
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
    const options = { year: "numeric", month: "short", day: "numeric" };
    return date.toLocaleDateString(undefined, options);
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMonths > 0) {
      return `${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
    } else if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
    } else {
      return "Today";
    }
  };

  // Generate a TOTP code if we have a secret (in a real app, this would use the TOTP algorithm)
  const generateTotpCode = () => {
    // This is a placeholder - in a real app, you would use a TOTP library
    if (!totpSecret) return null;

    // Generate a fake 6-digit code
    const fakeCode = Math.floor(100000 + Math.random() * 900000).toString();
    // Group into 3-digit chunks for readability (like 123 456)
    return `${fakeCode.substring(0, 3)} ${fakeCode.substring(3, 6)}`;
  };

  // Get website name
  const websiteName = metadata?.name || getDomain(url);

  // Get TOTP code if available
  const totpCode = authMethod === "totp" ? generateTotpCode() : null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 mb-4 overflow-hidden">
      <div className="flex flex-col">
        {/* Header section with website info */}
        <div className="flex items-center p-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-md bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden mr-3">
            {getFavicon() ? (
              <img
                src={getFavicon()}
                alt={websiteName}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1nbG9iZSI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiLz48cGF0aCBkPSJNMi4yMSAxMmExNSAxNSAwIDAgMSA3LjEtNy42Ii8+PHBhdGggZD0iTTEyIDE3LjhhMTUgMTUgMCAwIDEtOC4zNC0uMSIvPjxwYXRoIGQ9Ik0xMi4wMSA1LjVBMTUgMTUgMCAwIDEgMjAuMiAxMi4xNCIvPjxwYXRoIGQ9Ik0xMi4wMSAxOC41QTE1IDE1IDAgMCAxIDIwLjIgMTIuMTQiLz48cGF0aCBkPSJNMiAxMmg5Ii8+PHBhdGggZD0iTTEyIDJhMTAgMTAgMCAwIDEgOCAxNCIvPjwvc3ZnPg==";
                }}
              />
            ) : (
              <span className="text-gray-500 text-lg font-semibold">
                {websiteName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-grow mr-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              {websiteName}
              {metadata?.favorite && (
                <span className="ml-2 text-yellow-500">⭐</span>
              )}
            </h3>
            <div
              className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer flex items-center"
              onClick={openWebsite}
            >
              {url}
              <FaExternalLinkAlt className="ml-1 text-xs" />
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => onEdit(item)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Edit"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => onShare(item)}
              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
              title="Share"
            >
              <FaShareAlt />
            </button>
            <button
              onClick={() => onDelete(id)}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Delete"
            >
              <FaTrashAlt />
            </button>
          </div>
        </div>

        {/* Credentials section */}
        <div className="p-4">
          <div className="space-y-3">
            {/* Username field */}
            <div className="flex items-center justify-between">
              <div className="w-1/4 text-sm font-medium text-gray-600">
                Username
              </div>
              <div className="w-3/4 flex items-center">
                <span className="text-gray-800 mr-2 font-medium">
                  {username}
                </span>
                <button
                  onClick={() => copyToClipboard(username, "Username")}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  title="Copy username"
                >
                  <FaCopy />
                </button>
                {copied === "Username" && (
                  <span className="ml-1 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                    Copied
                  </span>
                )}
              </div>
            </div>

            {/* Password field */}
            <div className="flex items-center justify-between">
              <div className="w-1/4 text-sm font-medium text-gray-600">
                Password
              </div>
              <div className="w-3/4 flex items-center">
                <span className="text-gray-800 mr-2 font-mono">
                  {showPassword
                    ? password
                    : "•".repeat(Math.min(12, password.length))}
                </span>
                <button
                  onClick={toggleShowPassword}
                  className="text-gray-400 hover:text-blue-600 transition-colors mr-1"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
                <button
                  onClick={() => copyToClipboard(password, "Password")}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  title="Copy password"
                >
                  <FaCopy />
                </button>
                {copied === "Password" && (
                  <span className="ml-1 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                    Copied
                  </span>
                )}
              </div>
            </div>

            {/* TOTP field (if available) */}
            {authMethod === "totp" && totpCode && (
              <div className="flex items-center justify-between">
                <div className="w-1/4 text-sm font-medium text-gray-600">
                  Verification Code
                </div>
                <div className="w-3/4 flex items-center">
                  <div className="flex items-center bg-blue-50 px-2 py-1 rounded-md mr-2">
                    <FaKey className="text-blue-600 mr-1.5 text-xs" />
                    <span className="text-blue-800 font-mono font-medium">
                      {showTotpCode ? totpCode : "••• •••"}
                    </span>
                  </div>
                  <button
                    onClick={toggleShowTotpCode}
                    className="text-gray-400 hover:text-blue-600 transition-colors mr-1"
                    title={showTotpCode ? "Hide code" : "Show code"}
                  >
                    {showTotpCode ? <FaEyeSlash /> : <FaEye />}
                  </button>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        totpCode.replace(" ", ""),
                        "Verification code"
                      )
                    }
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title="Copy verification code"
                  >
                    <FaCopy />
                  </button>
                  {copied === "Verification code" && (
                    <span className="ml-1 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                      Copied
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Other authentication methods */}
            {authMethod && authMethod !== "none" && authMethod !== "totp" && (
              <div className="flex items-center justify-between">
                <div className="w-1/4 text-sm font-medium text-gray-600">
                  Authentication
                </div>
                <div className="w-3/4 flex items-center">
                  <div className="flex items-center bg-blue-50 px-2 py-1 rounded-md">
                    <FaLock className="text-blue-600 mr-1.5 text-xs" />
                    <span className="text-blue-800 text-sm">
                      {authMethod === "sms"
                        ? "SMS Authentication"
                        : authMethod === "email"
                        ? "Email Authentication"
                        : authMethod === "push"
                        ? "Push Notification"
                        : authMethod === "hardware"
                        ? "Hardware Key"
                        : "Two-Factor Authentication"}
                    </span>
                  </div>
                  {authDetails && (
                    <span className="ml-2 text-sm text-gray-600">
                      {authDetails}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Notes (if available) */}
            {notes && (
              <div className="flex items-start justify-between mt-2">
                <div className="w-1/4 text-sm font-medium text-gray-600 pt-1">
                  Notes
                </div>
                <div className="w-3/4 text-gray-700">
                  <p className="whitespace-pre-wrap text-sm bg-gray-50 p-2 rounded-md border border-gray-100">
                    {notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with metadata */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <FaRegClock className="mr-1" />
            <span>Created: {formatDate(createdAt)}</span>
          </div>
          <div className="flex items-center">
            <FaRegClock className="mr-1" />
            <span>Updated: {formatTimeAgo(updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedVaultItem;
