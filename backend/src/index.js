import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import postRoutes from './routes/post.route.js';
import eventRoutes from './routes/event.route.js';
import followRoutes from './routes/follow.route.js';
import geoRoutes from './routes/geo.route.js';
import votingRoutes from './routes/voting.route.js';
import adminRoutes from './routes/admin.route.js';
import commentRoutes from './routes/comment.route.js';
import reportRoutes from './routes/report.route.js';
import pollRoutes from './routes/poll.route.js';
import friendRoutes from './routes/friend.route.js';
import { connectDB } from './lib/db.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { app, server, io } from "./lib/socket.js";
import path from 'path';

const PORT = process.env.PORT;
const __dirname = path.resolve();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https://res.cloudinary.com"],
    },
  },
}));
app.use(cors({
  origin: process.env.NODE_ENV === "production" ? process.env.CLIENT_URL : ["http://localhost:5173", "http://localhost:5174"],
  credentials: true
}));
app.use(express.json({limit: '10mb'}));
app.use(cookieParser());

// Rate limiting on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many attempts, please try again later" },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/geo", geoRoutes);
app.use("/api/voting", votingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/friends", friendRoutes);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  connectDB();
});

// Graceful shutdown
const shutdown = () => {
  console.log("\nShutting down...");
  io.close(() => {
    server.close(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 3000);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
// nodemon sends SIGUSR2 on restart — clean up then re-signal so nodemon can proceed
process.once("SIGUSR2", () => {
  console.log("\nNodemon restart — closing server...");
  io.close(() => {
    server.close(() => process.kill(process.pid, "SIGUSR2"));
  });
  setTimeout(() => process.kill(process.pid, "SIGUSR2"), 3000);
});