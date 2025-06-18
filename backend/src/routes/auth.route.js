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

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);
router.get("/check", protectRoute, checkAuth);
router.get("/user/:identifier", protectRoute, getUser); // Get user by username or ID
router.get("/search", protectRoute, searchUsers); // Search users

export default router;