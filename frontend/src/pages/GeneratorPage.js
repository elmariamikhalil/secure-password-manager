// src/pages/GeneratorPage.js

import React from "react";
import PasswordGenerator from "../components/generator/PasswordGenerator";
import {
  FaLock,
  FaInfoCircle,
  FaShieldAlt,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

const GeneratorPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Password Generator
          </h1>
          <p className="text-gray-600 mt-1">
            Create strong, secure passwords for your accounts
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <PasswordGenerator />

            <div className="bg-white rounded-lg shadow-md p-6 mt-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaInfoCircle className="text-blue-600 mr-2" />
                Why Strong Passwords Matter
              </h2>

              <p className="text-gray-600 mb-4">
                Using strong, unique passwords is your first line of defense
                against hackers and identity theft. A strong password makes it
                exponentially more difficult for attackers to gain access to
                your accounts.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-red-50 p-4 rounded-md">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <FaExclamationTriangle className="text-red-500 mr-2" />
                    Weak Password Examples
                  </h3>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• password</li>
                    <li>• 12345678</li>
                    <li>• qwerty</li>
                    <li>• letmein</li>
                    <li>• admin</li>
                    <li>• welcome</li>
                    <li>• Your name or birthdate</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-md">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <FaCheckCircle className="text-green-500 mr-2" />
                    Strong Password Characteristics
                  </h3>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• At least 12 characters long</li>
                    <li>• Combination of upper and lowercase letters</li>
                    <li>• Includes numbers and special characters</li>
                    <li>• Not based on dictionary words</li>
                    <li>• Unique for each account</li>
                    <li>• No personal information</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaShieldAlt className="text-blue-600 mr-2" />
                Password Security Tips
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">
                    Use a unique password for each account
                  </h3>
                  <p className="text-sm text-gray-600">
                    If one account is compromised, your other accounts remain
                    secure.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">
                    Change passwords regularly
                  </h3>
                  <p className="text-sm text-gray-600">
                    Update important passwords every 3-6 months for enhanced
                    security.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">
                    Enable two-factor authentication
                  </h3>
                  <p className="text-sm text-gray-600">
                    Add an extra layer of security beyond just your password.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">
                    Avoid using personal information
                  </h3>
                  <p className="text-sm text-gray-600">
                    Don't include names, birthdates, or other identifiable
                    information.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">
                    Use a password manager
                  </h3>
                  <p className="text-sm text-gray-600">
                    Let SecureVault remember all your passwords so you don't
                    have to.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaLock className="text-blue-600 mr-2" />
                Did you know?
              </h2>

              <div className="space-y-4 text-gray-600">
                <p>
                  A 12-character password with numbers, symbols, and mixed-case
                  letters would take approximately <strong>34,000 years</strong>{" "}
                  to crack using current technology.
                </p>

                <p>
                  Over 80% of data breaches are caused by weak or reused
                  passwords.
                </p>

                <p>
                  The average person has over 100 online accounts requiring
                  passwords.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratorPage;
