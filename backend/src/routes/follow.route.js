import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import { Follow, Notification } from '../models/follow.model.js';
import User from '../models/user.model.js';

const router = express.Router();

// Follow a user
router.post("/follow/:userId", protectRoute, async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.user._id;

    if (currentUserId.toString() === targetUserId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: currentUserId,
      following: targetUserId
    });

    if (existingFollow) {
      return res.status(400).json({ message: "Already following this user" });
    }

    // Create follow relationship
    const follow = new Follow({
      follower: currentUserId,
      following: targetUserId
    });
    await follow.save();

    // Update user documents
    await User.findByIdAndUpdate(currentUserId, {
      $push: { following: targetUserId }
    });
    await User.findByIdAndUpdate(targetUserId, {
      $push: { followers: currentUserId }
    });

    // Create notification
    const notification = new Notification({
      recipient: targetUserId,
      sender: currentUserId,
      type: 'follow',
      message: `${req.user.username} started following you`
    });
    await notification.save();

    res.status(200).json({ message: "Successfully followed user" });
  } catch (error) {
    console.log("Error in followUser:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Unfollow a user
router.post("/unfollow/:userId", protectRoute, async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.user._id;

    // Remove follow relationship
    await Follow.findOneAndDelete({
      follower: currentUserId,
      following: targetUserId
    });

    // Update user documents
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: targetUserId }
    });
    await User.findByIdAndUpdate(targetUserId, {
      $pull: { followers: currentUserId }
    });

    res.status(200).json({ message: "Successfully unfollowed user" });
  } catch (error) {
    console.log("Error in unfollowUser:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user's followers
router.get("/followers/:userId", protectRoute, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId)
      .populate({
        path: 'followers',
        select: 'fullName username profilePic',
        options: { skip, limit }
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      followers: user.followers,
      total: user.followers.length
    });
  } catch (error) {
    console.log("Error in getFollowers:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user's following
router.get("/following/:userId", protectRoute, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId)
      .populate({
        path: 'following',
        select: 'fullName username profilePic',
        options: { skip, limit }
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      following: user.following,
      total: user.following.length
    });
  } catch (error) {
    console.log("Error in getFollowing:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Check if current user is following another user
router.get("/status/:userId", protectRoute, async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.user._id;

    const isFollowing = await Follow.findOne({
      follower: currentUserId,
      following: targetUserId
    });

    res.status(200).json({ isFollowing: !!isFollowing });
  } catch (error) {
    console.log("Error in getFollowStatus:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// NOTIFICATION ROUTES

// Get user's notifications
router.get("/notifications", protectRoute, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'fullName username profilePic')
      .populate('relatedPost', 'content')
      .populate('relatedEvent', 'title date')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });

    res.status(200).json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.log("Error in getNotifications:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Mark notification as read
router.put("/notifications/:notificationId/read", protectRoute, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.log("Error in markNotificationRead:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Mark all notifications as read
router.put("/notifications/read-all", protectRoute, async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.log("Error in markAllNotificationsRead:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete notification
router.delete("/notifications/:notificationId", protectRoute, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    console.log("Error in deleteNotification:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;