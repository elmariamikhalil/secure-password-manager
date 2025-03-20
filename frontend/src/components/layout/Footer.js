// src/components/layout/Footer.js

import React from "react";
import { Link } from "react-router-dom";
import { FaLock, FaGithub, FaTwitter, FaLinkedin } from "react-icons/fa";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              <FaLock className="text-blue-600 text-xl mr-2" />
              <span className="text-lg font-bold text-gray-800">
                SecureVault
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Secure password management with zero-knowledge encryption
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:space-x-8">
            <div className="mb-4 md:mb-0">
              <h3 className="font-semibold text-gray-700 mb-2">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/features"
                    className="text-sm text-gray-600 hover:text-blue-600"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    to="/security"
                    className="text-sm text-gray-600 hover:text-blue-600"
                  >
                    Security
                  </Link>
                </li>
                <li>
                  <Link
                    to="/extensions"
                    className="text-sm text-gray-600 hover:text-blue-600"
                  >
                    Browser Extensions
                  </Link>
                </li>
                <li>
                  <Link
                    to="/mobile"
                    className="text-sm text-gray-600 hover:text-blue-600"
                  >
                    Mobile Apps
                  </Link>
                </li>
              </ul>
            </div>

            <div className="mb-4 md:mb-0">
              <h3 className="font-semibold text-gray-700 mb-2">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/about"
                    className="text-sm text-gray-600 hover:text-blue-600"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/blog"
                    className="text-sm text-gray-600 hover:text-blue-600"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    to="/careers"
                    className="text-sm text-gray-600 hover:text-blue-600"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-sm text-gray-600 hover:text-blue-600"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/privacy"
                    className="text-sm text-gray-600 hover:text-blue-600"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="text-sm text-gray-600 hover:text-blue-600"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cookies"
                    className="text-sm text-gray-600 hover:text-blue-600"
                  >
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/gdpr"
                    className="text-sm text-gray-600 hover:text-blue-600"
                  >
                    GDPR Compliance
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-600 mb-4 md:mb-0">
            &copy; {currentYear} SecureVault. All rights reserved.
          </p>

          <div className="flex space-x-4">
            <a
              href="https://github.com/yourusername/secure-password-manager"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-800"
            >
              <FaGithub size={20} />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-blue-400"
            >
              <FaTwitter size={20} />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-blue-700"
            >
              <FaLinkedin size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
