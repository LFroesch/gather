import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import postRoutes from './routes/post.route.js';
import eventRoutes from './routes/event.route.js';
import followRoutes from './routes/follow.route.js';
import geoRoutes from './routes/geo.route.js';
import searchRoutes from './routes/search.route.js';
import { connectDB } from './lib/db.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { app, server } from "./lib/socket.js";
import path from 'path';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

// .env and Config
dotenv.config();
const PORT = process.env.PORT;
const __dirname = path.resolve();

// Middleware
// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL]
  : ["http://localhost:5173", "http://localhost:5174"];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: 86400 // 24 hours
}));
app.use(express.json({limit: '10mb'}));
app.use(cookieParser());

// Apply general rate limiting to all API routes
app.use('/api/', apiLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/geo", geoRoutes);
app.use("/api/search", searchRoutes);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Start the server
server.listen(PORT, () => {
  logger.success(`Server is running on http://localhost:${PORT}`);
  connectDB();
})