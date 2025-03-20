// frontend/src/components/auth/Register.js

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../../services/auth.service";
import { analyzePasswordStrength } from "../../utils/encryption";
import { useToast } from "../../components/common/Toast";

const Register = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    passwordHint: "",
  });

  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Analyze password strength when password changes
    if (name === "password") {
      if (value.length > 0) {
        const strength = analyzePasswordStrength(value);
        setPasswordStrength(strength);
      } else {
        setPasswordStrength(null);
      }
    }

    // Check if passwords match when confirm password changes
    if (name === "confirmPassword") {
      if (value !== formData.password) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: "Passwords do not match",
        }));
      } else {
        setErrors((prev) => ({ ...prev, confirmPassword: "" }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate email
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Validate first name
    if (!formData.firstName) {
      newErrors.firstName = "First name is required";
    }

    // Validate last name
    if (!formData.lastName) {
      newErrors.lastName = "Last name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log("Submitting registration form:", {
        ...formData,
        password: "[REDACTED]", // Don't log actual password
        confirmPassword: "[REDACTED]",
      });

      await register(formData);
      toast.success("Registration successful! Redirecting to vault...");
      navigate("/vault");
    } catch (error) {
      console.error("Registration error details:", error);

      if (error.details) {
        setErrors((prev) => ({
          ...prev,
          form: `Registration failed: ${error.details}`,
        }));
      } else if (error.message) {
        setErrors((prev) => ({ ...prev, form: error.message }));
      } else {
        setErrors((prev) => ({
          ...prev,
          form: "Registration failed. Please check your internet connection and try again.",
        }));
      }

      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // Rest of component remains the same...
};

export default Register;
