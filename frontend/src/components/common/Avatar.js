// src/components/common/Avatar.js

import React from "react";

const Avatar = ({ name, src, size = "md", shape = "circle", bgColor = "" }) => {
  // Size classes
  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
    xl: "w-16 h-16 text-xl",
  };

  // Shape classes
  const shapeClasses = {
    circle: "rounded-full",
    square: "rounded-md",
  };

  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return "?";

    const names = name.split(" ");
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(
      0
    )}`.toUpperCase();
  };

  // Generate color based on name
  const getColorClass = (name) => {
    if (bgColor) return bgColor;

    if (!name) return "bg-gray-300";

    // List of colors to cycle through
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];

    // Simple hash function to pick a color
    const hash = name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // If there's an image, show it
  if (src) {
    return (
      <img
        src={src}
        alt={name || "Avatar"}
        className={`${sizeClasses[size]} ${shapeClasses[shape]} object-cover`}
      />
    );
  }

  // Otherwise show initials
  return (
    <div
      className={`${sizeClasses[size]} ${shapeClasses[shape]} ${getColorClass(
        name
      )} flex items-center justify-center text-white font-medium`}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
