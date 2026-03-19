import Song from "../models/song.model.js";
import Comment from "../models/comment.model.js";
import Vote from "../models/vote.model.js";
import DailyChart from "../models/dailyChart.model.js";
import User from "../models/user.model.js";
import Event from "../models/event.model.js";
import Post from "../models/post.model.js";
import Message from "../models/message.model.js";
import Poll from "../models/poll.model.js";

// Get admin dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = await Promise.all([
      // Today's stats
      Vote.countDocuments({ voteDate: { $gte: today, $lt: tomorrow } }),
      Vote.distinct('userId', { voteDate: { $gte: today, $lt: tomorrow } }),
      Song.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Event.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Post.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      User.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),

      // All time stats
      Vote.countDocuments(),
      Song.countDocuments(),
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      Event.countDocuments(),
      Post.countDocuments(),
      Message.countDocuments(),
      Event.countDocuments({ date: { $gte: today } }),

      // Recent activity
      Song.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('submittedBy', 'username profilePic')
        .select('title artist createdAt submittedBy'),
      Vote.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'username')
        .populate('songId', 'title artist'),
      Event.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('creator', 'username profilePic')
        .select('title date category creator createdAt'),
      Post.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('author', 'username profilePic')
        .select('content author createdAt likes')
    ]);

    const dashboardStats = {
      today: {
        votes: stats[0],
        uniqueVoters: stats[1].length,
        newSongs: stats[2],
        newEvents: stats[3],
        newPosts: stats[4],
        newUsers: stats[5]
      },
      allTime: {
        totalVotes: stats[6],
        totalSongs: stats[7],
        totalUsers: stats[8],
        adminUsers: stats[9],
        totalEvents: stats[10],
        totalPosts: stats[11],
        totalMessages: stats[12],
        upcomingEvents: stats[13]
      },
      recentSongs: stats[14],
      recentVotes: stats[15],
      recentEvents: stats[16],
      recentPosts: stats[17]
    };

    res.status(200).json(dashboardStats);
  } catch (error) {
    console.error("Error in getDashboardStats: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all users with pagination and filtering
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    // Demo sessions only see demo users
    if (req.user.isDemo) query.isDemo = true;
    if (role && role !== 'all') {
      query.role = role;
    }
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { username: { $regex: escaped, $options: 'i' } },
        { fullName: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error in getUsers: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Only admins can change roles (not moderators)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Only admins can change user roles" });
    }

    // Don't allow admins to demote themselves
    if (userId === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ message: "Cannot change your own admin role" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user, message: "User role updated successfully" });
  } catch (error) {
    console.error("Error in updateUserRole: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all songs with admin controls
export const getSongs = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, sortBy = 'createdAt' } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { artist: { $regex: escaped, $options: 'i' } },
        { album: { $regex: escaped, $options: 'i' } }
      ];
    }

    let sortOption = {};
    switch (sortBy) {
      case 'votes':
        sortOption = { totalVotes: -1 };
        break;
      case 'dailyVotes':
        sortOption = { dailyVotes: -1 };
        break;
      case 'title':
        sortOption = { title: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const [songs, total] = await Promise.all([
      Song.find(query)
        .populate('submittedBy', 'username profilePic role')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit)),
      Song.countDocuments(query)
    ]);

    res.status(200).json({
      songs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalSongs: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error in getSongs: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete song
export const deleteSong = async (req, res) => {
  try {
    const { songId } = req.params;

    const song = await Song.findByIdAndDelete(songId);
    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    // Also delete associated votes
    await Vote.deleteMany({ songId });

    res.status(200).json({ message: "Song deleted successfully" });
  } catch (error) {
    console.error("Error in deleteSong: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Toggle song active status
export const toggleSongStatus = async (req, res) => {
  try {
    const { songId } = req.params;

    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    song.isActive = !song.isActive;
    await song.save();

    res.status(200).json({ 
      song, 
      message: `Song ${song.isActive ? 'activated' : 'deactivated'} successfully` 
    });
  } catch (error) {
    console.error("Error in toggleSongStatus: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get voting analytics
export const getVotingAnalytics = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const dailyStats = await Vote.aggregate([
      {
        $match: {
          voteDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$voteDate" }
          },
          votes: { $sum: 1 },
          uniqueVoters: { $addToSet: "$userId" }
        }
      },
      {
        $project: {
          date: "$_id",
          votes: 1,
          uniqueVoters: { $size: "$uniqueVoters" }
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);

    const topSongs = await Song.find()
      .sort({ totalVotes: -1 })
      .limit(10)
      .populate('submittedBy', 'username')
      .select('title artist totalVotes dailyVotes submittedBy');

    const topVoters = await User.aggregate([
      {
        $sort: { 'votingStats.totalVotes': -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          username: 1,
          totalVotes: '$votingStats.totalVotes',
          votingStreak: '$votingStats.votingStreak'
        }
      }
    ]);

    res.status(200).json({
      dailyStats,
      topSongs,
      topVoters
    });
  } catch (error) {
    console.error("Error in getVotingAnalytics: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.status(200).json({ message: "Post deleted" });
  } catch (error) {
    console.error("Error in deletePost:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.status(200).json({ message: "Event deleted" });
  } catch (error) {
    console.error("Error in deleteEvent:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Error in deleteComment:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot ban yourself" });
    }

    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ message: "User not found" });
    if (req.user.role === 'moderator' && (target.role === 'admin' || target.role === 'moderator')) {
      return res.status(403).json({ message: "Moderators cannot ban admins or other moderators" });
    }

    const user = await User.findByIdAndUpdate(userId, { isBanned: true }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User banned", user });
  } catch (error) {
    console.error("Error in banUser:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(userId, { isBanned: false }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User unbanned", user });
  } catch (error) {
    console.error("Error in unbanUser:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Poll management
export const getAdminPolls = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status !== 'all') query.status = status;

    const [polls, total] = await Promise.all([
      Poll.find(query)
        .populate('creator', 'fullName username profilePic')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Poll.countDocuments(query)
    ]);

    const pollsWithMeta = polls.map(poll => {
      const pollObj = poll.toObject();
      const totalVotes = pollObj.options.reduce((sum, opt) => sum + opt.voters.length, 0);
      return {
        ...pollObj,
        totalVotes,
        options: pollObj.options.map(opt => ({
          _id: opt._id,
          text: opt.text,
          voteCount: opt.voters.length
        }))
      };
    });

    res.status(200).json({
      polls: pollsWithMeta,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error in getAdminPolls:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updatePollStatus = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Status must be approved or rejected" });
    }

    const poll = await Poll.findByIdAndUpdate(pollId, { status }, { new: true })
      .populate('creator', 'fullName username profilePic');
    if (!poll) return res.status(404).json({ message: "Poll not found" });

    res.status(200).json({ message: `Poll ${status}`, poll });
  } catch (error) {
    console.error("Error in updatePollStatus:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteAdminPoll = async (req, res) => {
  try {
    const poll = await Poll.findByIdAndDelete(req.params.pollId);
    if (!poll) return res.status(404).json({ message: "Poll not found" });
    res.status(200).json({ message: "Poll deleted" });
  } catch (error) {
    console.error("Error in deleteAdminPoll:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};