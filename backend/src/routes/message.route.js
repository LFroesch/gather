import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import { sanitizeInput } from '../middleware/sanitize.js';
import { getUsersForSidebar, getMessages, sendMessage, markMessagesAsRead, getUnreadCounts } from '../controllers/message.controller.js';

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/unread-counts", protectRoute, getUnreadCounts);
router.put("/read/:id", protectRoute, markMessagesAsRead);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sanitizeInput(['text']), (req, res, next) => {
  if (req.body.text && req.body.text.length > 2000) {
    return res.status(400).json({ message: 'Message must be 2000 characters or less' });
  }
  next();
}, sendMessage);

export default router;