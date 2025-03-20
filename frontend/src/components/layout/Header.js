// src/components/layout/Header.js

import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaLock,
  FaUserCircle,
  FaCog,
  FaSignOutAlt,
  FaShieldAlt,
  FaKey,
  FaChartPie,
} from "react-icons/fa";
import {
  isAuthenticated,
  getCurrentUser,
  logout,
} from "../../services/auth.service";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const authenticated = isAuthenticated();
  const user = getCurrentUser();

  // Skip header on auth pages
  const isAuthPage = ["/login", "/register", "/forgot-password"].includes(
    location.pathname
  );
  if (isAuthPage) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  const isActive = (path) => {
    return location.pathname === path ? "text-blue-600 font-medium" : "";
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <FaLock className="text-blue-600 text-2xl mr-2" />
              <span className="text-xl font-bold text-gray-800">
                SecureVault
              </span>
            </Link>

            {authenticated && (
              <nav className="ml-10 hidden md:flex space-x-8">
                <Link
                  to="/dashboard"
                  className={`text-gray-600 hover:text-blue-600 flex items-center ${isActive(
                    "/dashboard"
                  )}`}
                >
                  <FaChartPie className="mr-1" />
                  Dashboard
                </Link>
                <Link
                  to="/vault"
                  className={`text-gray-600 hover:text-blue-600 flex items-center ${isActive(
                    "/vault"
                  )}`}
                >
                  <FaShieldAlt className="mr-1" />
                  Vault
                </Link>
                <Link
                  to="/generator"
                  className={`text-gray-600 hover:text-blue-600 flex items-center ${isActive(
                    "/generator"
                  )}`}
                >
                  <FaKey className="mr-1" />
                  Generator
                </Link>
              </nav>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-600 hover:text-blue-600 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {showMobileMenu ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {authenticated ? (
            <div className="hidden md:block relative">
              <button
                onClick={toggleDropdown}
                className="flex items-center text-gray-700 hover:text-blue-600 focus:outline-none"
              >
                <FaUserCircle className="text-xl mr-2" />
                <span className="font-medium">
                  {user?.firstName || user?.email}
                </span>
                <svg
                  className="ml-1 h-4 w-4 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    <div className="flex items-center">
                      <FaUserCircle className="mr-2" />
                      Profile
                    </div>
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    <div className="flex items-center">
                      <FaCog className="mr-2" />
                      Settings
                    </div>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <FaSignOutAlt className="mr-2" />
                      Logout
                    </div>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-blue-600 font-medium"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {authenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`block px-3 py-2 rounded-md ${
                    isActive("/dashboard")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600"
                  }`}
                  onClick={closeMobileMenu}
                >
                  <div className="flex items-center">
                    <FaChartPie className="mr-2" />
                    Dashboard
                  </div>
                </Link>
                <Link
                  to="/vault"
                  className={`block px-3 py-2 rounded-md ${
                    isActive("/vault")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600"
                  }`}
                  onClick={closeMobileMenu}
                >
                  <div className="flex items-center">
                    <FaShieldAlt className="mr-2" />
                    Vault
                  </div>
                </Link>
                <Link
                  to="/generator"
                  className={`block px-3 py-2 rounded-md ${
                    isActive("/generator")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600"
                  }`}
                  onClick={closeMobileMenu}
                >
                  <div className="flex items-center">
                    <FaKey className="mr-2" />
                    Generator
                  </div>
                </Link>
                <Link
                  to="/profile"
                  className={`block px-3 py-2 rounded-md ${
                    isActive("/profile")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600"
                  }`}
                  onClick={closeMobileMenu}
                >
                  <div className="flex items-center">
                    <FaUserCircle className="mr-2" />
                    Profile
                  </div>
                </Link>
                <Link
                  to="/settings"
                  className={`block px-3 py-2 rounded-md ${
                    isActive("/settings")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600"
                  }`}
                  onClick={closeMobileMenu}
                >
                  <div className="flex items-center">
                    <FaCog className="mr-2" />
                    Settings
                  </div>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    closeMobileMenu();
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-gray-600"
                >
                  <div className="flex items-center">
                    <FaSignOutAlt className="mr-2" />
                    Logout
                  </div>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-gray-600"
                  onClick={closeMobileMenu}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-md text-blue-600 font-medium"
                  onClick={closeMobileMenu}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
