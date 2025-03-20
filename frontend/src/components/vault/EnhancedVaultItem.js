// frontend/src/components/vault/EnhancedVaultItem.js

import React, { useState } from "react";
import {
  FaEye,
  FaEyeSlash,
  FaCopy,
  FaEdit,
  FaTrashAlt,
  FaShareAlt,
  FaEllipsisV,
  FaPen,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { useToast } from "../common/Toast";
import Avatar from "../common/Avatar";

const EnhancedVaultItem = ({ item, onEdit, onDelete, onShare }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
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

  // Toggle action menu
  const toggleMenu = () => {
    setShowMenu(!showMenu);
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

  // Get website name
  const websiteName = metadata?.name || getDomain(url);

  return (
    <div className="card hover:border-primary-100 transition-all duration-300 mb-4 animate-fade-in">
      <div className="flex items-start">
        <div className="mr-4 flex-shrink-0">
          <Avatar src={getIcon()} name={websiteName} size="lg" shape="square" />
        </div>

        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-dark-800">
                  {websiteName}
                </h3>
                {item.metadata?.favorite && (
                  <span className="ml-2 text-yellow-500">⭐</span>
                )}
              </div>
              <p
                className="text-sm text-dark-500 hover:text-primary-600 cursor-pointer flex items-center"
                onClick={openWebsite}
              >
                {url}
                <FaExternalLinkAlt className="ml-1 text-xs" />
              </p>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={onEdit.bind(null, item)}
                className="btn btn-icon btn-outline btn-sm text-dark-500 hover:text-primary-600"
                title="Edit"
              >
                <FaEdit />
              </button>
              <button
                onClick={onShare.bind(null, item)}
                className="btn btn-icon btn-outline btn-sm text-dark-500 hover:text-primary-600"
                title="Share"
              >
                <FaShareAlt />
              </button>
              <button
                onClick={onDelete.bind(null, id)}
                className="btn btn-icon btn-outline btn-sm text-dark-500 hover:text-danger-500"
                title="Delete"
              >
                <FaTrashAlt />
              </button>
              <div className="relative">
                <button
                  onClick={toggleMenu}
                  className="btn btn-icon btn-outline btn-sm text-dark-500 hover:text-dark-700"
                  title="More options"
                >
                  <FaEllipsisV />
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10 animate-fade-in">
                    <button
                      onClick={() => {
                        copyToClipboard(url, "URL");
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-dark-700 hover:bg-gray-100"
                    >
                      Copy URL
                    </button>
                    <button
                      onClick={() => {
                        copyToClipboard(username, "Username");
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-dark-700 hover:bg-gray-100"
                    >
                      Copy Username
                    </button>
                    <button
                      onClick={() => {
                        copyToClipboard(password, "Password");
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-dark-700 hover:bg-gray-100"
                    >
                      Copy Password
                    </button>
                    <button
                      onClick={() => {
                        openWebsite();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-dark-700 hover:bg-gray-100"
                    >
                      Visit Website
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-1/4 text-sm text-dark-500 font-medium">
                Username
              </div>
              <div className="w-3/4 flex items-center">
                <span className="text-dark-800 mr-2 font-mono">{username}</span>
                <button
                  onClick={() => copyToClipboard(username, "username")}
                  className="text-dark-500 hover:text-primary-600"
                  title="Copy username"
                >
                  <FaCopy />
                </button>
                {copied === "username" && (
                  <span className="badge badge-success ml-1">Copied!</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="w-1/4 text-sm text-dark-500 font-medium">
                Password
              </div>
              <div className="w-3/4 flex items-center">
                <span className="text-dark-800 mr-2 font-mono">
                  {showPassword ? password : "••••••••••••"}
                </span>
                <button
                  onClick={toggleShowPassword}
                  className="text-dark-500 hover:text-primary-600 mr-1"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
                <button
                  onClick={() => copyToClipboard(password, "password")}
                  className="text-dark-500 hover:text-primary-600"
                  title="Copy password"
                >
                  <FaCopy />
                </button>
                {copied === "password" && (
                  <span className="badge badge-success ml-1">Copied!</span>
                )}
              </div>
            </div>

            {notes && (
              <div className="flex items-start justify-between">
                <div className="w-1/4 text-sm text-dark-500 font-medium pt-1">
                  Notes
                </div>
                <div className="w-3/4 text-dark-800">
                  <p className="whitespace-pre-wrap text-sm">{notes}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-xs text-dark-500">
            <span>Created: {formatDate(createdAt)}</span>
            <span>Updated: {formatTimeAgo(updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedVaultItem;
