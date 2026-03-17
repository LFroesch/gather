import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import { sanitizeInput } from '../middleware/sanitize.js';
import Post from '../models/post.model.js';
import Comment from '../models/comment.model.js';
import User from '../models/user.model.js';
import { Notification } from '../models/follow.model.js';
import cloudinary from '../lib/cloudinary.js';
import { validateImage } from '../lib/utils.js';

const router = express.Router();

// Attach commentCount to an array of posts
const attachCommentCounts = async (posts) => {
  const postIds = posts.map(p => p._id || p);
  const counts = await Comment.aggregate([
    { $match: { parentType: 'post', parentId: { $in: postIds } } },
    { $group: { _id: '$parentId', count: { $sum: 1 } } }
  ]);
  const countMap = Object.fromEntries(counts.map(c => [c._id.toString(), c.count]));
  return posts.map(p => {
    const obj = p.toObject ? p.toObject() : p;
    return { ...obj, commentCount: countMap[obj._id.toString()] || 0 };
  });
};

// Create a new post
router.post("/", protectRoute, sanitizeInput(['content']), async (req, res) => {
  try {
    const { content, image, type = 'general', eventId, placeName, location: bodyLocation } = req.body;
    const userId = req.user._id;

    if (!content && !image) {
      return res.status(400).json({ message: "Content or image is required" });
    }

    if (!req.user.currentCity || !req.user.currentCity.city) {
      return res.status(400).json({ message: "Location required. Please update your location in settings." });
    }

    let imageUrl;
    if (image) {
      const { valid, error } = validateImage(image);
      if (!valid) return res.status(400).json({ message: error });
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    // Use provided location or fall back to user's city
    let postLocation = req.user.currentCity;
    if (bodyLocation?.city && bodyLocation?.coordinates?.length === 2) {
      // Validate within 100mi of user's city
      if (req.user.currentCity?.coordinates && req.user.currentCity.coordinates[0] !== 0) {
        const [lng1, lat1] = req.user.currentCity.coordinates;
        const [lng2, lat2] = bodyLocation.coordinates;
        const R = 3959;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2)**2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        if (dist > 100) {
          return res.status(400).json({ message: "Location must be within 100 miles of your city" });
        }
      }
      postLocation = bodyLocation;
    }

    const newPost = new Post({
      content,
      author: userId,
      location: postLocation,
      placeName: placeName?.trim() || undefined,
      image: imageUrl,
      type,
      event: eventId || null
    });

    await newPost.save();
    await newPost.populate('author', 'fullName username profilePic');

    res.status(201).json(newPost);
  } catch (error) {
    console.error("Error in createPost:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Search posts
router.get("/search", protectRoute, async (req, res) => {
  try {
    const { q, scope = 'nearby' } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const user = req.user;

    if (!q || q.length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters" });
    }

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const textMatch = { content: { $regex: escaped, $options: 'i' } };

    if (scope === 'following') {
      const posts = await Post.find({
        ...textMatch,
        author: { $in: user.following }
      })
      .populate('author', 'fullName username profilePic')
      .populate('event', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

      return res.status(200).json(await attachCommentCounts(posts));
    }

    // scope === 'nearby'
    const searchLocation = user.locationSettings.autoDetectLocation
      ? user.currentCity.coordinates
      : user.locationSettings.searchLocation.coordinates;
    const radiusInMeters = (user.locationSettings.nearMeRadius || 25) * 1609.34;

    if (!searchLocation || searchLocation[0] === 0) {
      return res.status(400).json({ message: "Location not set." });
    }

    const posts = await Post.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: searchLocation },
          distanceField: "distance",
          maxDistance: radiusInMeters,
          spherical: true,
          query: textMatch
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users", localField: "author", foreignField: "_id", as: "author",
          pipeline: [{ $project: { fullName: 1, username: 1, profilePic: 1 } }]
        }
      },
      {
        $lookup: {
          from: "events", localField: "event", foreignField: "_id", as: "event",
          pipeline: [{ $project: { title: 1 } }]
        }
      },
      {
        $addFields: {
          author: { $arrayElemAt: ["$author", 0] },
          event: { $arrayElemAt: ["$event", 0] },
          distanceInMiles: { $divide: ["$distance", 1609.34] }
        }
      }
    ]);

    res.status(200).json(await attachCommentCounts(posts));
  } catch (error) {
    console.error("Error in searchPosts:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get posts for following feed
router.get("/following", protectRoute, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({
      author: { $in: req.user.following }
    })
    .populate('author', 'fullName username profilePic')
    .populate('event', 'title')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

    res.status(200).json(await attachCommentCounts(posts));
  } catch (error) {
    console.error("Error in getFollowingPosts:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get posts near user's search location
router.get("/nearby", protectRoute, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = req.user;
    const searchLocation = user.locationSettings.autoDetectLocation 
      ? user.currentCity.coordinates 
      : user.locationSettings.searchLocation.coordinates;
    
    const radiusInMiles = user.locationSettings.nearMeRadius || 25;
    const radiusInMeters = radiusInMiles * 1609.34; // Convert miles to meters

    if (!searchLocation || searchLocation[0] === 0) {
      return res.status(400).json({ message: "Location not set. Please update your location in settings." });
    }

    const posts = await Post.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: searchLocation
          },
          distanceField: "distance",
          maxDistance: radiusInMeters,
          spherical: true
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
          pipeline: [
            { $project: { fullName: 1, username: 1, profilePic: 1 } }
          ]
        }
      },
      {
        $lookup: {
          from: "events",
          localField: "event",
          foreignField: "_id",
          as: "event",
          pipeline: [
            { $project: { title: 1 } }
          ]
        }
      },
      {
        $addFields: {
          author: { $arrayElemAt: ["$author", 0] },
          event: { $arrayElemAt: ["$event", 0] },
          distanceInMiles: { $divide: ["$distance", 1609.34] }
        }
      }
    ]);

    res.status(200).json(await attachCommentCounts(posts));
  } catch (error) {
    console.error("Error in getNearbyPosts:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// get logged in users posts
router.get("/my-posts", protectRoute, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: userId })
      .populate('author', 'fullName username profilePic')
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit);

    if (!posts) {
      return res.status(200).json([]);
    }

    const user = req.user;
    const userLocation = user.currentCity?.coordinates;

    // Get comment counts
    const postsWithComments = await attachCommentCounts(posts);

    // Add distance and interaction data for each post
    const postsWithDetails = postsWithComments.map(post => {
      let distanceInMiles = 0;

      if (userLocation && userLocation[0] !== 0 && post.location?.coordinates) {
        const [userLng, userLat] = userLocation;
        const [postLng, postLat] = post.location.coordinates;

        const R = 3959;
        const dLat = (postLat - userLat) * Math.PI / 180;
        const dLon = (postLng - userLng) * Math.PI / 180;
        const a =
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(userLat * Math.PI / 180) * Math.cos(postLat * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distanceInMiles = R * c;
      }

      return {
        ...post,
        distanceInMiles,
        likeCount: post.likes?.length || 0,
        isLiked: post.likes?.some(id => id.toString() === userId.toString()) || false
      };
    });

    res.status(200).json(postsWithDetails);
  } catch (error) {
    console.error("Error in getMyPosts:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get posts by user
router.get("/user/:userId", protectRoute, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: userId })
      .populate('author', 'fullName username profilePic')
      .populate('event', 'title')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    res.status(200).json(await attachCommentCounts(posts));
  } catch (error) {
    console.error("Error in getUserPosts:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Like/unlike a post
router.post("/:postId/like", protectRoute, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    } else {
      // Like
      post.likes.push(userId);
      
      // Create notification if not own post
      if (post.author.toString() !== userId.toString()) {
        const notification = new Notification({
          recipient: post.author,
          sender: userId,
          type: 'like_post',
          message: `${req.user.username} liked your post`,
          relatedPost: postId
        });
        await notification.save();
      }
    }

    await post.save();
    
    res.status(200).json({ 
      isLiked: !isLiked, 
      likeCount: post.likes.length,
      likes: post.likes // Send the full likes array
    });
  } catch (error) {
    console.error("Error in likePost:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a post
router.delete("/:postId", protectRoute, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error in deletePost:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;

router.get("/:postId", protectRoute, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate('author', 'fullName username profilePic')
      .populate('event', 'title');

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const [postWithCount] = await attachCommentCounts([post]);
    res.status(200).json(postWithCount);
  } catch (error) {
    console.error("Error in getPost:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});