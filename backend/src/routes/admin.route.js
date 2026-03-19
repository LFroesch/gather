import express from "express";
import { protectRoute, demoGuard } from "../middleware/protectRoute.js";
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
router.put("/users/:userId/role", demoGuard, updateUserRole);

// Song management
router.get("/songs", getSongs);
router.delete("/songs/:songId", demoGuard, deleteSong);
router.put("/songs/:songId/toggle", demoGuard, toggleSongStatus);

// Content moderation
router.delete("/posts/:postId", demoGuard, deletePost);
router.delete("/events/:eventId", demoGuard, deleteEvent);
router.delete("/comments/:commentId", demoGuard, deleteComment);
router.put("/users/:userId/ban", demoGuard, banUser);
router.put("/users/:userId/unban", demoGuard, unbanUser);

// Poll management
router.get("/polls", getAdminPolls);
router.put("/polls/:pollId/status", demoGuard, updatePollStatus);
router.delete("/polls/:pollId", demoGuard, deleteAdminPoll);

export default router;