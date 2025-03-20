// src/components/common/DeleteConfirmation.js

import React from "react";
import { FaExclamationTriangle, FaTimes } from "react-icons/fa";

const DeleteConfirmation = ({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <FaTimes size={20} />
        </button>

        <div className="flex items-center mb-6">
          <FaExclamationTriangle className="text-red-500 mr-3 text-xl" />
          <h2 className="text-2xl font-bold text-gray-800">
            {title || "Confirm Deletion"}
          </h2>
        </div>

        <div className="mb-6">
          <p className="text-gray-700">
            {message ||
              "Are you sure you want to delete this item? This action cannot be undone."}
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {confirmLabel || "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
