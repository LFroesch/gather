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
  changePassword,
  demoLogin
} from '../controllers/auth.controller.js';
import { protectRoute, demoGuard } from '../middleware/protectRoute.js';
import { sanitizeInput } from '../middleware/sanitize.js';

const router = express.Router();

router.post("/signup", sanitizeInput(['fullName', 'bio']), signup);
router.post("/login", login);
router.post("/demo-login", demoLogin);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.put("/update-profile", protectRoute, demoGuard, sanitizeInput(['fullName', 'bio']), updateProfile);
router.put("/change-password", protectRoute, demoGuard, changePassword);
router.get("/check", protectRoute, checkAuth);
router.get("/user/:identifier", protectRoute, getUser);
router.get("/search", protectRoute, searchUsers);

export default router;