import express from 'express';
import { 
  checkAuth, 
  login, 
  logout, 
  signup, 
  updateProfile, 
  getUser, 
  searchUsers 
} from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/protectRoute.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);
router.get("/check", protectRoute, checkAuth);
router.get("/user/:identifier", protectRoute, getUser); // Get user by username or ID
router.get("/search", protectRoute, searchUsers); // Search users

export default router;