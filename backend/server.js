// server.js - Main entry point with proper CORS and error handling

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const path = require("path");

// Routes
const authRoutes = require("./routes/auth.routes");
const vaultRoutes = require("./routes/vault.routes");
const userRoutes = require("./routes/user.routes");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// Configure CORS with more detailed options
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://kael.es",
      "https://www.kael.es",
      "http://kael.es",
      "http://www.kael.es",
      "http://13.50.122.95",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Increase JSON payload limit for larger encryption keys
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Connection to MongoDB with better error handling
const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/password-manager";
    console.log("Connecting to MongoDB at:", mongoURI);

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

connectDB();

// Log all incoming requests (useful for debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Define routes
app.use("/api/auth", authRoutes);
app.use("/api/vault", vaultRoutes);
app.use("/api/user", userRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
  });
}

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
