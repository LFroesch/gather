import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { adminRoute } from "../middleware/adminRoute.js";
import {
  getDashboardStats,
  getUsers,
  updateUserRole,
  getSongs,
  deleteSong,
  toggleSongStatus,
  getVotingAnalytics,
  deletePost,
  deleteEvent,
  deleteComment,
  banUser,
  unbanUser,
  getAdminPolls,
  updatePollStatus,
  deleteAdminPoll
} from "../controllers/admin.controller.js";

const router = express.Router();

// All admin routes require auth + admin role
router.use(protectRoute, adminRoute);

// Dashboard
router.get("/dashboard", getDashboardStats);
router.get("/analytics", getVotingAnalytics);

// User management
router.get("/users", getUsers);
router.put("/users/:userId/role", updateUserRole);

// Song management
router.get("/songs", getSongs);
router.delete("/songs/:songId", deleteSong);
router.put("/songs/:songId/toggle", toggleSongStatus);

// Content moderation
router.delete("/posts/:postId", deletePost);
router.delete("/events/:eventId", deleteEvent);
router.delete("/comments/:commentId", deleteComment);
router.put("/users/:userId/ban", banUser);
router.put("/users/:userId/unban", unbanUser);

// Poll management
router.get("/polls", getAdminPolls);
router.put("/polls/:pollId/status", updatePollStatus);
router.delete("/polls/:pollId", deleteAdminPoll);

export default router;