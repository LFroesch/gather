import Poll from "../models/poll.model.js";
import User from "../models/user.model.js";
import { Notification } from "../models/follow.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { demoFilter } from "../lib/utils.js";

// Haversine distance in miles
const haversineDistance = (coords1, coords2) => {
  const [lng1, lat1] = coords1;
  const [lng2, lat2] = coords2;
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const getPolls = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = req.query.filter || 'active';
    const category = req.query.category;

    const df = demoFilter(req.user);

    // "mine" tab — no geo filtering
    if (filter === 'mine') {
      const query = { creator: req.user._id, ...df };
      if (category) query.category = category;

      const polls = await Poll.find(query)
        .populate('creator', 'fullName username profilePic')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return res.status(200).json(polls.map(poll => formatPoll(poll.toObject(), req.user._id)));
    }

    // active/expired — use $geoNear for location-based filtering
    const user = req.user;
    const searchLocation = user.locationSettings?.autoDetectLocation
      ? user.currentCity?.coordinates
      : user.locationSettings?.searchLocation?.coordinates;
    const radiusInMeters = (user.locationSettings?.nearMeRadius || 25) * 1609.34;

    // Fall back to non-geo query if no location set
    if (!searchLocation || searchLocation[0] === 0) {
      const query = { status: 'approved', ...df };
      if (filter === 'active') query.expiresAt = { $gt: new Date() };
      else if (filter === 'expired') query.expiresAt = { $lte: new Date() };
      if (category) query.category = category;

      const polls = await Poll.find(query)
        .populate('creator', 'fullName username profilePic')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return res.status(200).json(polls.map(poll => formatPoll(poll.toObject(), req.user._id)));
    }

    const baseQuery = { status: 'approved', ...df };
    if (filter === 'active') baseQuery.expiresAt = { $gt: new Date() };
    else if (filter === 'expired') baseQuery.expiresAt = { $lte: new Date() };
    if (category) baseQuery.category = category;

    // Geo query for polls WITH location
    const geoPolls = await Poll.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: searchLocation },
          distanceField: "distance",
          maxDistance: radiusInMeters,
          spherical: true,
          query: baseQuery
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: limit + skip },
      {
        $lookup: {
          from: "users",
          localField: "creator",
          foreignField: "_id",
          as: "creator",
          pipeline: [{ $project: { fullName: 1, username: 1, profilePic: 1 } }]
        }
      },
      {
        $addFields: {
          creator: { $arrayElemAt: ["$creator", 0] },
          distanceInMiles: { $divide: ["$distance", 1609.34] }
        }
      }
    ]);

    // Also fetch polls WITHOUT location (legacy data)
    const noLocationQuery = {
      ...baseQuery, ...df,
      $or: [
        { "location.coordinates": { $exists: false } },
        { "location.coordinates": [0, 0] },
        { location: { $exists: false } }
      ]
    };
    const legacyPolls = await Poll.find(noLocationQuery)
      .populate('creator', 'fullName username profilePic')
      .sort({ createdAt: -1 })
      .limit(limit + skip);

    // Merge, deduplicate, sort, paginate
    const geoPollIds = new Set(geoPolls.map(p => p._id.toString()));
    const merged = [
      ...geoPolls,
      ...legacyPolls.filter(p => !geoPollIds.has(p._id.toString())).map(p => p.toObject())
    ];
    merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const paginated = merged.slice(skip, skip + limit);

    res.status(200).json(paginated.map(poll => formatPoll(poll, req.user._id)));
  } catch (error) {
    console.error("Error in getPolls:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createPoll = async (req, res) => {
  try {
    const { question, options, expiresAt, location, category, placeName } = req.body;

    if (!question || !options || !expiresAt) {
      return res.status(400).json({ message: "Question, options, and expiration date are required" });
    }

    if (!Array.isArray(options) || options.length < 2 || options.length > 4) {
      return res.status(400).json({ message: "Polls must have 2-4 options" });
    }

    const expDate = new Date(expiresAt);
    if (expDate <= new Date()) {
      return res.status(400).json({ message: "Expiration must be in the future" });
    }

    // Location required
    if (!location || !location.city || !location.coordinates || location.coordinates.length !== 2) {
      return res.status(400).json({ message: "Location is required" });
    }

    // 100mi radius check against user's city
    if (req.user.currentCity?.coordinates && req.user.currentCity.coordinates[0] !== 0) {
      const dist = haversineDistance(req.user.currentCity.coordinates, location.coordinates);
      if (dist > 100) {
        return res.status(400).json({ message: "Location must be within 100 miles of your city" });
      }
    }

    // Rate limit: 5 polls per day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const pollsToday = await Poll.countDocuments({
      creator: req.user._id,
      createdAt: { $gte: todayStart }
    });
    if (pollsToday >= 5) {
      return res.status(429).json({ message: "You can only create 5 polls per day" });
    }

    const poll = new Poll({
      question: question.trim(),
      options: options.map(text => ({ text: text.trim(), voters: [] })),
      creator: req.user._id,
      expiresAt: expDate,
      location,
      category: category || 'general',
      placeName: placeName?.trim() || undefined,
      ...(req.user.isDemo && { isDemo: true })
    });

    await poll.save();
    await poll.populate('creator', 'fullName username profilePic');

    // Notify admins/moderators
    try {
      const admins = await User.find({ role: { $in: ['admin', 'moderator'] } }).select('_id');
      if (admins.length > 0) {
        const notifications = admins.map(admin => ({
          recipient: admin._id,
          sender: req.user._id,
          type: 'poll_pending',
          message: `${req.user.username} created a poll: "${question.trim().substring(0, 50)}"`,
          relatedPoll: poll._id
        }));
        const saved = await Notification.insertMany(notifications);

        // Send real-time notifications
        for (const notif of saved) {
          const socketId = getReceiverSocketId(notif.recipient.toString());
          if (socketId) {
            const populated = await Notification.findById(notif._id).populate('sender', 'fullName username profilePic');
            io.to(socketId).emit("newNotification", populated);
          }
        }
      }
    } catch (notifError) {
      console.error("Error notifying admins:", notifError.message);
    }

    const pollObj = poll.toObject();
    res.status(201).json({
      ...pollObj,
      totalVotes: 0,
      userVotedOption: null,
      status: 'pending',
      options: pollObj.options.map(opt => ({
        _id: opt._id,
        text: opt.text,
        voteCount: 0
      }))
    });
  } catch (error) {
    console.error("Error in createPoll:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const votePoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { optionIndex } = req.body;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (poll.status !== 'approved') {
      return res.status(400).json({ message: "This poll is not yet approved" });
    }

    if (poll.expiresAt <= new Date()) {
      return res.status(400).json({ message: "This poll has expired" });
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ message: "Invalid option" });
    }

    const alreadyVoted = poll.options.some(opt =>
      opt.voters.some(v => v.toString() === req.user._id.toString())
    );
    if (alreadyVoted) {
      return res.status(400).json({ message: "You have already voted on this poll" });
    }

    poll.options[optionIndex].voters.push(req.user._id);
    await poll.save();

    const pollObj = poll.toObject();
    const totalVotes = pollObj.options.reduce((sum, opt) => sum + opt.voters.length, 0);

    res.status(200).json({
      totalVotes,
      userVotedOption: optionIndex,
      options: pollObj.options.map(opt => ({
        _id: opt._id,
        text: opt.text,
        voteCount: opt.voters.length
      }))
    });
  } catch (error) {
    console.error("Error in votePoll:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deletePoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const poll = await Poll.findById(pollId);

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (poll.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own polls" });
    }

    await Poll.findByIdAndDelete(pollId);
    res.status(200).json({ message: "Poll deleted" });
  } catch (error) {
    console.error("Error in deletePoll:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Helper to format poll for response (works with both mongoose docs and plain objects)
function formatPoll(pollObj, userId) {
  const totalVotes = pollObj.options.reduce((sum, opt) => sum + (opt.voters?.length || opt.voteCount || 0), 0);
  const userVotedOption = pollObj.options.findIndex(opt =>
    opt.voters?.some(v => v.toString() === userId.toString())
  );
  return {
    ...pollObj,
    totalVotes,
    userVotedOption: userVotedOption >= 0 ? userVotedOption : null,
    options: pollObj.options.map(opt => ({
      _id: opt._id,
      text: opt.text,
      voteCount: opt.voters?.length || opt.voteCount || 0,
      voters: undefined
    }))
  };
}
