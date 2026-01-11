const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { connectDB, closeDB } = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// ======================
// Middlewares
// ======================

// Security headers
app.use(helmet());

// HTTP request logging
app.use(morgan("dev"));

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Vite dev server
      "http://localhost:5174",
      // Add production URLs later
    ],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
app.use("/api", limiter);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// Routes
// ======================

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🇩🇪 DeutschShikhi API is running!",
    version: "1.0.0",
  });
});

// API health check
app.get("/api/v1/health", (req, res) => {
  res.json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
  });
});

// ======================
// API Routes
// ======================

// Auth & User Routes
app.use("/api/v1/auth", require("./routes/auth.routes"));
app.use("/api/v1/users", require("./routes/user.routes"));

// Public Content Routes
app.use("/api/v1/levels", require("./routes/level.routes"));
app.use("/api/v1/lessons", require("./routes/lesson.routes"));
app.use("/api/v1/words", require("./routes/word.routes"));
app.use("/api/v1/exercises", require("./routes/exercise.routes"));

// User Progress Routes
app.use("/api/v1/progress", require("./routes/progress.routes"));

// Settings Routes
app.use("/api/v1/settings", require("./routes/settings.routes"));

// Admin Routes
app.use("/api/v1/admin", require("./routes/admin.routes"));

// Video Rooms (add later)
// app.use("/api/v1/video-rooms", require("./routes/videoRoom.routes"));

// Seed Routes (DEV ONLY - remove in production!)
if (process.env.NODE_ENV === "development") {
  app.use("/api/v1/seed", require("./routes/seed.routes"));
}

// ======================
// Error Handling
// ======================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ======================
// Start Server
// ======================

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");
  await closeDB();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nShutting down gracefully...");
  await closeDB();
  process.exit(0);
});

// Start the server
startServer();

// Leaderboard Routes
const leaderboardRoutes = require("./routes/leaderboard.routes");
app.use("/api/v1/leaderboard", leaderboardRoutes);

// Grammar Routes
const grammarRoutes = require("./routes/grammar.routes");
app.use("/api/v1/grammar", grammarRoutes);
