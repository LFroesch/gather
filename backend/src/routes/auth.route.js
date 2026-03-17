import express from 'express';
import {
  checkAuth,
  login,
  logout,
  signup,
  updateProfile,
  getUser,
  searchUsers,
  forgotPassword,
  resetPassword,
  changePassword
} from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/protectRoute.js';
import { sanitizeInput } from '../middleware/sanitize.js';

const router = express.Router();

router.post("/signup", sanitizeInput(['fullName', 'bio']), signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.put("/update-profile", protectRoute, sanitizeInput(['fullName', 'bio']), updateProfile);
router.put("/change-password", protectRoute, changePassword);
router.get("/check", protectRoute, checkAuth);
router.get("/user/:identifier", protectRoute, getUser);
router.get("/search", protectRoute, searchUsers);

export default router;