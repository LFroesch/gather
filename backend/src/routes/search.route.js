import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import Event from '../models/event.model.js';
import User from '../models/user.model.js';
import Post from '../models/post.model.js';
import { validateSearch } from '../middleware/validation.js';
import { searchLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Global search endpoint
router.get("/", protectRoute, searchLimiter, validateSearch, async (req, res) => {
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

    // Search regex (case-insensitive)
    const searchRegex = new RegExp(q, 'i');

    // Search events
    if (type === 'all' || type === 'events') {
      const eventQuery = {
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { tags: { $in: [searchRegex] } }
        ]
      };

      results.events = await Event.find(eventQuery)
        .populate('organizer', 'username fullName profilePic')
        .limit(20)
        .sort({ date: 1 })
        .lean();

      // Add distance if user has location
      if (userLocation) {
        results.events = results.events.map(event => {
          if (event.location?.coordinates) {
            const distance = calculateDistance(
              userLocation[1], userLocation[0],
              event.location.coordinates[1], event.location.coordinates[0]
            );
            return { ...event, distance };
          }
          return event;
        });
      }
    }

    // Search users
    if (type === 'all' || type === 'users') {
      results.users = await User.find({
        _id: { $ne: userId },
        $or: [
          { username: searchRegex },
          { fullName: searchRegex },
          { bio: searchRegex }
        ]
      })
        .select('username fullName profilePic bio')
        .limit(20)
        .lean();
    }

    // Search posts
    if (type === 'all' || type === 'posts') {
      results.posts = await Post.find({
        $or: [
          { text: searchRegex },
          { tags: { $in: [searchRegex] } }
        ]
      })
        .populate('author', 'username fullName profilePic')
        .populate('event', 'title')
        .limit(20)
        .sort({ createdAt: -1 })
        .lean();
    }

    // Calculate summary
    const summary = {
      total: results.events.length + results.users.length + results.posts.length,
      events: results.events.length,
      users: results.users.length,
      posts: results.posts.length
    };

    res.status(200).json({
      success: true,
      results,
      summary
    });
  } catch (error) {
    console.error("Error in search:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Radius of Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default router;
