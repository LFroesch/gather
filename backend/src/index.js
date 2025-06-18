import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import postRoutes from './routes/post.route.js';
import eventRoutes from './routes/event.route.js';
import followRoutes from './routes/follow.route.js';
import geoRoutes from './routes/geo.route.js';
import { connectDB } from './lib/db.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { app, server } from "./lib/socket.js";
import path from 'path';

// .env and Config
dotenv.config();
const PORT = process.env.PORT;
const __dirname = path.resolve();

// Middleware
app.use(cors({
  origin: ["http://localhost:5173"],
  credentials: true
}));
app.use(express.json({limit: '10mb'}));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/geo", geoRoutes);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  connectDB();
})