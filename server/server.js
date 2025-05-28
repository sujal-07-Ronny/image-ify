import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import userRouter from "./routes/userRoutes.js";
import imageRouter from "./routes/imageRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;
const CLIENT_URL = process.env.CLIENT_URL || "https://image-ify-m3tj.vercel.app";

if (!MONGO_URI) {
  console.error("❌ MongoDB URI is missing! Check your .env file.");
  process.exit(1);
}

// Middleware
const corsOptions = {
  origin: [
    "https://image-ify-m3tj.vercel.app", // Removed trailing slash
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.path}`);
  next();
});

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  }
};
connectDB();

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// API Routes - FIXED: Changed from /api/users to /api/user to match frontend
app.use("/api/user", userRouter);
app.use("/api/image", imageRouter);

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Image-ify API Server is running",
    endpoints: {
      health: "/api/health",
      user: "/api/user",
      image: "/api/image"
    }
  });
});

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  const dirPath = path.resolve();
  app.use(express.static(path.join(dirPath, "./client/dist")));
  
  // Handle React routing - this should be AFTER API routes
  app.get("*", (req, res) => {
    // Only serve React app for non-API routes
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(dirPath, "./client/dist", "index.html"));
    } else {
      res.status(404).json({
        success: false,
        message: `API endpoint ${req.method} ${req.path} not found`,
      });
    }
  });
}

// 404 Handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.path} not found`,
    availableEndpoints: [
      "GET /api/health",
      "POST /api/user/register",
      "POST /api/user/login",
      "GET /api/user/credits"
    ]
  });
});

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   - Health: http://localhost:${PORT}/api/health`);
  console.log(`   - User Auth: http://localhost:${PORT}/api/user`);
  console.log(`   - Images: http://localhost:${PORT}/api/image`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log("Server and DB connections closed");
      process.exit(0);
    });
  });
});

// Export for Vercel
export default app;