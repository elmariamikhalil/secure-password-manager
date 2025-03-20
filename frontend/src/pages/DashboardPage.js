// src/pages/DashboardPage.js

import React from "react";
import { FaLock, FaKey, FaShieldAlt, FaUserShield } from "react-icons/fa";
import PasswordDashboard from "../components/dashboard/PasswordDashboard";

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of your password security and vault statistics
          </p>
        </div>

        <PasswordDashboard />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full">
                <FaLock className="text-blue-600 text-xl" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Secure Vault
            </h3>
            <p className="text-gray-600 text-sm">
              All your passwords are stored with zero-knowledge encryption. Only
              you can access your data.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full">
                <FaKey className="text-green-600 text-xl" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Auto-Fill
            </h3>
            <p className="text-gray-600 text-sm">
              Save time with automatic form filling. Securely log in with just a
              click.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center p-3 bg-purple-100 rounded-full">
                <FaShieldAlt className="text-purple-600 text-xl" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Password Generator
            </h3>
            <p className="text-gray-600 text-sm">
              Create strong, unique passwords for every account to enhance your
              security.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center p-3 bg-yellow-100 rounded-full">
                <FaUserShield className="text-yellow-600 text-xl" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Cross-Platform
            </h3>
            <p className="text-gray-600 text-sm">
              Access your passwords from any device with our web app, browser
              extensions, and mobile apps.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Security Tips
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Creating Strong Passwords
              </h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Use a minimum of 12 characters</li>
                <li>Include a mix of uppercase and lowercase letters</li>
                <li>Add numbers and special characters</li>
                <li>Avoid using personal information</li>
                <li>Don't use common words or phrases</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Best Practices
              </h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Use a unique password for each account</li>
                <li>Change passwords every 90 days</li>
                <li>Enable two-factor authentication when available</li>
                <li>Don't share passwords with others</li>
                <li>Be cautious of phishing attempts</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold text-gray-800">
                Upgrade to Premium
              </h2>
              <p className="text-gray-600">
                Get advanced features like breach monitoring, secure file
                storage, and priority support.
              </p>
            </div>
            <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
