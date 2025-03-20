// src/components/dashboard/PasswordDashboard.js

import React, { useState, useEffect } from "react";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaLock,
  FaChartPie,
} from "react-icons/fa";
import {
  getVaultItems,
  checkPasswordStrength,
} from "../../services/vault.service";

const PasswordDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    weak: 0,
    moderate: 0,
    strong: 0,
    reused: 0,
    old: 0,
  });

  // Password age threshold in days (90 days)
  const OLD_PASSWORD_THRESHOLD = 90 * 24 * 60 * 60 * 1000;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all vault items
      const items = await getVaultItems();

      // Initialize stats
      const newStats = {
        total: items.length,
        weak: 0,
        moderate: 0,
        strong: 0,
        reused: 0,
        old: 0,
      };

      // Check for password reuse
      const passwordMap = new Map();

      // Analyze each password
      items.forEach((item) => {
        if (!item.password) return;

        // Check password strength
        const strength = checkPasswordStrength(item.password);

        if (strength.score < 40) {
          newStats.weak++;
        } else if (strength.score < 70) {
          newStats.moderate++;
        } else {
          newStats.strong++;
        }

        // Check for reused passwords
        if (passwordMap.has(item.password)) {
          passwordMap.set(item.password, passwordMap.get(item.password) + 1);
        } else {
          passwordMap.set(item.password, 1);
        }

        // Check for old passwords
        const updatedAt = new Date(item.updatedAt);
        const now = new Date();
        const passwordAge = now - updatedAt;

        if (passwordAge > OLD_PASSWORD_THRESHOLD) {
          newStats.old++;
        }
      });

      // Count reused passwords
      passwordMap.forEach((count, password) => {
        if (count > 1) {
          newStats.reused += count;
        }
      });

      setStats(newStats);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate overall security score (0-100)
  const calculateSecurityScore = () => {
    if (stats.total === 0) return 0;

    // Factors to consider:
    // 1. Percentage of strong passwords
    // 2. Percentage of non-reused passwords
    // 3. Percentage of recently updated passwords

    const strongPasswordScore = (stats.strong / stats.total) * 100 * 0.5;
    const uniquePasswordScore =
      ((stats.total - stats.reused) / stats.total) * 100 * 0.3;
    const freshPasswordScore =
      ((stats.total - stats.old) / stats.total) * 100 * 0.2;

    return Math.round(
      strongPasswordScore + uniquePasswordScore + freshPasswordScore
    );
  };

  // Get appropriate class based on score
  const getScoreClass = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  // Render security score
  const securityScore = calculateSecurityScore();

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <FaChartPie className="text-blue-600 mr-3" />
        Password Health Dashboard
      </h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 rounded-lg p-6 flex flex-col items-center">
          <div
            className={`text-5xl font-bold mb-2 ${getScoreClass(
              securityScore
            )}`}
          >
            {securityScore}
          </div>
          <div className="text-gray-600 text-center">Security Score</div>
          <div className="mt-3 text-sm text-center text-gray-500">
            Based on password strength, uniqueness, and age
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Password Strength
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Strong</span>
                <span>{stats.strong} passwords</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${
                      stats.total > 0 ? (stats.strong / stats.total) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Moderate</span>
                <span>{stats.moderate} passwords</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500"
                  style={{
                    width: `${
                      stats.total > 0 ? (stats.moderate / stats.total) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Weak</span>
                <span>{stats.weak} passwords</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500"
                  style={{
                    width: `${
                      stats.total > 0 ? (stats.weak / stats.total) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
              <FaLock className="text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {stats.total}
              </h3>
              <p className="text-gray-600">Total Passwords</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-full p-3">
              <FaExclamationTriangle className="text-yellow-600 text-xl" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {stats.reused}
              </h3>
              <p className="text-gray-600">Reused Passwords</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-full p-3">
              <FaTimesCircle className="text-red-600 text-xl" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {stats.old}
              </h3>
              <p className="text-gray-600">Outdated Passwords</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={loadDashboardData}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Refresh Dashboard
        </button>
      </div>
    </div>
  );
};

export default PasswordDashboard;
