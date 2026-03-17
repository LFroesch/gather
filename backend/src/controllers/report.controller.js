import Report from '../models/report.model.js';
import Post from '../models/post.model.js';
import Event from '../models/event.model.js';
import Comment from '../models/comment.model.js';
import User from '../models/user.model.js';

export const submitReport = async (req, res) => {
  try {
    const { contentType, contentId, reason, details } = req.body;

    if (!contentType || !contentId || !reason) {
      return res.status(400).json({ message: 'contentType, contentId, and reason are required' });
    }

    const report = new Report({
      reporter: req.user._id,
      contentType,
      contentId,
      reason,
      details: details || ''
    });

    await report.save();
    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (error) {
    console.error('Error in submitReport:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, contentType } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (contentType && contentType !== 'all') query.contentType = contentType;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('reporter', 'username profilePic')
        .populate('reviewedBy', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Report.countDocuments(query)
    ]);

    res.status(200).json({
      reports,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error in getReports:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const reviewReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, deleteContent, banUser } = req.body;

    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    if (!['reviewed', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Status must be reviewed or dismissed' });
    }

    report.status = status;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    await report.save();

    // Look up author BEFORE potentially deleting the content
    let authorId;
    if (status === 'reviewed' && (deleteContent || banUser)) {
      if (report.contentType === 'user') authorId = report.contentId;
      else if (report.contentType === 'post') authorId = (await Post.findById(report.contentId))?.author;
      else if (report.contentType === 'event') authorId = (await Event.findById(report.contentId))?.creator;
      else if (report.contentType === 'comment') authorId = (await Comment.findById(report.contentId))?.author;
    }

    if (deleteContent && status === 'reviewed') {
      switch (report.contentType) {
        case 'post': await Post.findByIdAndDelete(report.contentId); break;
        case 'event': await Event.findByIdAndDelete(report.contentId); break;
        case 'comment': await Comment.findByIdAndDelete(report.contentId); break;
        default: break;
      }
    }

    if (banUser && status === 'reviewed' && authorId) {
      await User.findByIdAndUpdate(authorId, { isBanned: true });
    }

    res.status(200).json({ message: 'Report reviewed', report });
  } catch (error) {
    console.error('Error in reviewReport:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};
