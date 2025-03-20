// frontend/src/App.js

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { isAuthenticated } from "./services/auth.service";
import { ToastProvider } from "./components/common/Toast";

// Pages
import VaultPage from "./pages/VaultPage";
import DashboardPage from "./pages/DashboardPage";
import GeneratorPage from "./pages/GeneratorPage";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ForgotPassword from "./components/auth/ForgotPassword";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

// Protected route component
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Header />

          <main className="flex-grow">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/vault"
                element={
                  <ProtectedRoute>
                    <VaultPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/generator"
                element={
                  <ProtectedRoute>
                    <GeneratorPage />
                  </ProtectedRoute>
                }
              />

              {/* Redirect to dashboard or login based on authentication status */}
              <Route
                path="/"
                element={
                  isAuthenticated() ? (
                    <Navigate to="/dashboard" />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              {/* Catch all route - redirect to login */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
