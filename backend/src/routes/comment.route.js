import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import { sanitizeInput } from '../middleware/sanitize.js';
import Comment from '../models/comment.model.js';
import Post from '../models/post.model.js';
import Event from '../models/event.model.js';
import { Notification } from '../models/follow.model.js';

const router = express.Router();

// Toggle like on a comment (must be before /:parentType/:parentId routes)
router.post("/:commentId/like", protectRoute, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const isLiked = comment.likes.includes(userId);

    if (isLiked) {
      comment.likes = comment.likes.filter(id => id.toString() !== userId.toString());
    } else {
      comment.likes.push(userId);

      // Send notification to comment author
      if (comment.author.toString() !== userId.toString()) {
        const notification = new Notification({
          recipient: comment.author,
          sender: userId,
          type: 'like_comment',
          message: `${req.user.username} liked your comment`,
          ...(comment.parentType === 'post'
            ? { relatedPost: comment.parentId }
            : { relatedEvent: comment.parentId })
        });
        await notification.save();
      }
    }

    await comment.save();
    res.status(200).json({ likes: comment.likes });
  } catch (error) {
    console.error("Error in toggleCommentLike:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a comment
router.delete("/:commentId", protectRoute, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    let canDelete = comment.author.toString() === userId.toString();

    if (!canDelete) {
      if (comment.parentType === 'post') {
        const post = await Post.findById(comment.parentId);
        canDelete = post && post.author.toString() === userId.toString();
      } else {
        const event = await Event.findById(comment.parentId);
        canDelete = event && event.creator.toString() === userId.toString();
      }
    }

    if (!canDelete) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    await Comment.findByIdAndDelete(commentId);
    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Error in deleteComment:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create a comment
router.post("/:parentType/:parentId", protectRoute, sanitizeInput(['text']), async (req, res) => {
  try {
    const { parentType, parentId } = req.params;
    const { text, replyTo } = req.body;
    const userId = req.user._id;

    if (!['post', 'event'].includes(parentType)) {
      return res.status(400).json({ message: "Invalid parent type" });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    let parentOwnerId;
    if (parentType === 'post') {
      const post = await Post.findById(parentId);
      if (!post) return res.status(404).json({ message: "Post not found" });
      parentOwnerId = post.author;
    } else {
      const event = await Event.findById(parentId);
      if (!event) return res.status(404).json({ message: "Event not found" });
      parentOwnerId = event.creator;
    }

    const comment = new Comment({
      text: text.trim(),
      author: userId,
      parentType,
      parentId,
      ...(replyTo && { replyTo })
    });

    await comment.save();
    await comment.populate('author', 'fullName username profilePic');

    if (parentOwnerId.toString() !== userId.toString()) {
      const notification = new Notification({
        recipient: parentOwnerId,
        sender: userId,
        type: 'comment',
        message: `${req.user.username} commented on your ${parentType}`,
        ...(parentType === 'post' ? { relatedPost: parentId } : { relatedEvent: parentId })
      });
      await notification.save();
    }

    // Notify the comment author if this is a reply (and they're not the same user)
    if (replyTo) {
      const parentComment = await Comment.findById(replyTo).select('author');
      if (parentComment && parentComment.author.toString() !== userId.toString()) {
        const replyNotif = new Notification({
          recipient: parentComment.author,
          sender: userId,
          type: 'reply',
          message: `${req.user.username} replied to your comment`,
          ...(parentType === 'post' ? { relatedPost: parentId } : { relatedEvent: parentId })
        });
        await replyNotif.save();
      }
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error("Error in createComment:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get comments for a post/event
router.get("/:parentType/:parentId", protectRoute, async (req, res) => {
  try {
    const { parentType, parentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!['post', 'event'].includes(parentType)) {
      return res.status(400).json({ message: "Invalid parent type" });
    }

    const comments = await Comment.find({ parentType, parentId })
      .populate('author', 'fullName username profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json(comments);
  } catch (error) {
    console.error("Error in getComments:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
