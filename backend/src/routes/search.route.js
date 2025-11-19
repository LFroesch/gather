import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import Event from '../models/event.model.js';
import User from '../models/user.model.js';
import Post from '../models/post.model.js';
import { validateSearch } from '../middleware/validation.js';

const router = express.Router();

// Global search endpoint
router.get("/", protectRoute, validateSearch, async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    const userId = req.user._id;
    const userLocation = req.user.locationSettings?.searchLocation?.coordinates || req.user.currentCity?.coordinates;
    const searchRadius = req.user.locationSettings?.nearMeRadius || 25;

    const results = {
      events: [],
      users: [],
      posts: []
    };

    // Search Events
    if (type === 'all' || type === 'events') {
      const eventQuery = {
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { tags: { $in: [new RegExp(q, 'i')] } },
          { category: { $regex: q, $options: 'i' } }
        ]
      };

      // Add location filter if user has location set
      if (userLocation && userLocation.length === 2) {
        eventQuery['location.coordinates'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: userLocation
            },
            $maxDistance: searchRadius * 1609.34 // Convert miles to meters
          }
        };
      }

      results.events = await Event.find(eventQuery)
        .populate('creator', 'fullName username profilePic')
        .limit(10)
        .sort({ date: 1 })
        .lean();
    }

    // Search Users
    if (type === 'all' || type === 'users') {
      results.users = await User.find({
        _id: { $ne: userId }, // Exclude current user
        $or: [
          { fullName: { $regex: q, $options: 'i' } },
          { username: { $regex: q, $options: 'i' } },
          { bio: { $regex: q, $options: 'i' } }
        ]
      })
        .select('fullName username profilePic bio followers')
        .limit(10)
        .lean();
    }

    // Search Posts
    if (type === 'all' || type === 'posts') {
      const postQuery = {
        content: { $regex: q, $options: 'i' }
      };

      // Add location filter if user has location set
      if (userLocation && userLocation.length === 2) {
        postQuery['location.coordinates'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: userLocation
            },
            $maxDistance: searchRadius * 1609.34
          }
        };
      }

      results.posts = await Post.find(postQuery)
        .populate('author', 'fullName username profilePic')
        .limit(10)
        .sort({ createdAt: -1 })
        .lean();
    }

    // Add result counts
    const summary = {
      total: results.events.length + results.users.length + results.posts.length,
      events: results.events.length,
      users: results.users.length,
      posts: results.posts.length
    };

    res.status(200).json({
      query: q,
      type,
      summary,
      results
    });
  } catch (error) {
    console.error("Error in search:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
