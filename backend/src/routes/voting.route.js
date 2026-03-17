import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { sanitizeInput } from "../middleware/sanitize.js";
import {
  getTodaysSongs,
  submitSong,
  voteSong,
  getDailyChart,
  getVotingStats
} from "../controllers/voting.controller.js";

const router = express.Router();

// Public routes
router.get("/daily-chart/:date?", getDailyChart);
router.get("/stats", getVotingStats);

// Protected routes
router.get("/today", protectRoute, getTodaysSongs);
router.post("/submit", protectRoute, sanitizeInput(['title', 'artist', 'album']), (req, res, next) => {
  for (const field of ['title', 'artist', 'album']) {
    if (req.body[field] && req.body[field].length > 100) {
      return res.status(400).json({ message: `${field} must be 100 characters or less` });
    }
  }
  next();
}, submitSong);
router.post("/vote/:songId", protectRoute, voteSong);

export default router;