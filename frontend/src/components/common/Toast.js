// src/components/common/Toast.js

import React, { useState, useEffect, createContext, useContext } from "react";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimes,
} from "react-icons/fa";

// Create Toast Context
const ToastContext = createContext();

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Add a new toast
  const addToast = (message, type = "info", duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts([...toasts, { id, message, type, duration }]);
    return id;
  };

  // Remove a toast
  const removeToast = (id) => {
    setToasts(toasts.filter((toast) => toast.id !== id));
  };

  // Convenience methods for different toast types
  const success = (message, duration) => addToast(message, "success", duration);
  const error = (message, duration) => addToast(message, "error", duration);
  const info = (message, duration) => addToast(message, "info", duration);
  const warning = (message, duration) => addToast(message, "warning", duration);

  return (
    <ToastContext.Provider
      value={{ addToast, removeToast, success, error, info, warning }}
    >
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// Hook to use the toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// Individual Toast Component
const Toast = ({ id, message, type, removeToast }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(id);
    }, 4000);

    return () => clearTimeout(timer);
  }, [id, removeToast]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <FaCheckCircle className="text-success-500" />;
      case "error":
        return <FaExclamationTriangle className="text-danger-500" />;
      case "warning":
        return <FaExclamationTriangle className="text-warning-500" />;
      case "info":
      default:
        return <FaInfoCircle className="text-info-500" />;
    }
  };

  return (
    <div className={`toast toast-${type}`}>
      <div className="p-4 flex items-start">
        <div className="flex-shrink-0 mr-3 mt-0.5">{getIcon()}</div>
        <div className="flex-1 mr-2">
          <p className="text-sm text-dark-800">{message}</p>
        </div>
        <button
          onClick={() => removeToast(id)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

// Toast Container Component
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          removeToast={removeToast}
        />
      ))}
    </div>
  );
};

export default Toast;
