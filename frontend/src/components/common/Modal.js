// src/components/common/Modal.js

import React, { useEffect, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import { createPortal } from "react-dom";

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  const modalRef = useRef(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    // Handle escape key to close
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscKey);
      // Prevent scrolling when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
      // Restore scrolling when modal is closed
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Don't render if not open
  if (!isOpen) return null;

  // Determine modal size class
  const sizeClass =
    {
      sm: "max-w-md",
      md: "max-w-lg",
      lg: "max-w-2xl",
      xl: "max-w-4xl",
      full: "max-w-full mx-4",
    }[size] || "max-w-lg";

  // Create portal for modal
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity animate-fade-in"></div>

      <div
        ref={modalRef}
        className={`relative ${sizeClass} w-full bg-white rounded-xl shadow-xl transform transition-all animate-slide-up`}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-dark-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
