import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import Friendship from '../models/friendship.model.js';
import { Notification } from '../models/follow.model.js';
import User from '../models/user.model.js';

const router = express.Router();

// Send friend request
router.post("/request/:userId", protectRoute, async (req, res) => {
  try {
    const { userId: recipientId } = req.params;
    const requesterId = req.user._id;

    if (requesterId.toString() === recipientId) {
      return res.status(400).json({ message: "You cannot friend yourself" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ message: "User not found" });

    // Check for existing friendship in either direction
    const existing = await Friendship.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (existing) {
      if (existing.status === 'accepted') return res.status(400).json({ message: "Already friends" });
      return res.status(400).json({ message: "Friend request already exists" });
    }

    const friendship = new Friendship({ requester: requesterId, recipient: recipientId });
    await friendship.save();

    const notification = new Notification({
      recipient: recipientId,
      sender: requesterId,
      type: 'friend_request',
      message: `${req.user.username} sent you a friend request`
    });
    await notification.save();

    res.status(200).json({ message: "Friend request sent" });
  } catch (error) {
    console.error("Error in sendFriendRequest:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Accept friend request
router.post("/accept/:userId", protectRoute, async (req, res) => {
  try {
    const { userId: requesterId } = req.params;
    const recipientId = req.user._id;

    const friendship = await Friendship.findOne({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending'
    });

    if (!friendship) return res.status(404).json({ message: "No pending friend request found" });

    friendship.status = 'accepted';
    await friendship.save();

    // Add to both users' friends arrays
    await User.findByIdAndUpdate(requesterId, { $addToSet: { friends: recipientId } });
    await User.findByIdAndUpdate(recipientId, { $addToSet: { friends: requesterId } });

    const notification = new Notification({
      recipient: requesterId,
      sender: recipientId,
      type: 'friend_accept',
      message: `${req.user.username} accepted your friend request`
    });
    await notification.save();

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("Error in acceptFriendRequest:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Reject friend request
router.post("/reject/:userId", protectRoute, async (req, res) => {
  try {
    const { userId: requesterId } = req.params;
    const recipientId = req.user._id;

    const result = await Friendship.findOneAndDelete({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending'
    });

    if (!result) return res.status(404).json({ message: "No pending friend request found" });

    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    console.error("Error in rejectFriendRequest:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Cancel outgoing friend request
router.post("/cancel/:userId", protectRoute, async (req, res) => {
  try {
    const { userId: recipientId } = req.params;
    const requesterId = req.user._id;

    const result = await Friendship.findOneAndDelete({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending'
    });

    if (!result) return res.status(404).json({ message: "No pending friend request found" });

    res.status(200).json({ message: "Friend request cancelled" });
  } catch (error) {
    console.error("Error in cancelFriendRequest:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Remove friend
router.delete("/remove/:userId", protectRoute, async (req, res) => {
  try {
    const { userId: friendId } = req.params;
    const currentUserId = req.user._id;

    const result = await Friendship.findOneAndDelete({
      $or: [
        { requester: currentUserId, recipient: friendId, status: 'accepted' },
        { requester: friendId, recipient: currentUserId, status: 'accepted' }
      ]
    });

    if (!result) return res.status(404).json({ message: "Friendship not found" });

    await User.findByIdAndUpdate(currentUserId, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: currentUserId } });

    res.status(200).json({ message: "Friend removed" });
  } catch (error) {
    console.error("Error in removeFriend:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get friend status with a user
router.get("/status/:userId", protectRoute, async (req, res) => {
  try {
    const { userId: targetId } = req.params;
    const currentUserId = req.user._id;

    const friendship = await Friendship.findOne({
      $or: [
        { requester: currentUserId, recipient: targetId },
        { requester: targetId, recipient: currentUserId }
      ]
    });

    let status = 'none';
    if (friendship) {
      if (friendship.status === 'accepted') {
        status = 'friends';
      } else if (friendship.requester.toString() === currentUserId.toString()) {
        status = 'pending_sent';
      } else {
        status = 'pending_received';
      }
    }

    // Check if current user can message this user
    const targetUser = await User.findById(targetId).select('messagingPreference friends');
    const canMessage = targetUser?.messagingPreference === 'everyone' || status === 'friends';

    res.status(200).json({ status, canMessage });
  } catch (error) {
    console.error("Error in getFriendStatus:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get friends list for a user
router.get("/list/:userId", protectRoute, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId)
      .populate({
        path: 'friends',
        select: 'fullName username profilePic',
        options: { skip, limit }
      });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      friends: user.friends,
      total: user.friends.length
    });
  } catch (error) {
    console.error("Error in getFriendsList:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get incoming friend requests for current user
router.get("/requests", protectRoute, async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const requests = await Friendship.find({
      recipient: currentUserId,
      status: 'pending'
    })
    .populate('requester', 'fullName username profilePic')
    .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error in getIncomingRequests:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
