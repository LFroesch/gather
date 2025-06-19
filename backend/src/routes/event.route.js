import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import Event from '../models/event.model.js';
import { Notification } from '../models/follow.model.js';
import cloudinary from '../lib/cloudinary.js';

const router = express.Router();

// Create a new event
router.post("/", protectRoute, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      date, 
      endDate,
      category = 'other', 
      maxAttendees,
      isPrivate = false,
      venue,
      tags = [],
      image 
    } = req.body;
    const userId = req.user._id;

    if (!title || !description || !date) {
      return res.status(400).json({ message: "Title, description, and date are required" });
    }

    if (!req.user.currentCity || !req.user.currentCity.city) {
      return res.status(400).json({ message: "Location required. Please update your location in settings." });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newEvent = new Event({
      title,
      description,
      creator: userId,
      location: {
        ...req.user.currentCity,
        venue
      },
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : null,
      category,
      maxAttendees,
      isPrivate,
      image: imageUrl,
      tags,
      attendees: [{ user: userId, status: 'yes' }] // Creator auto-attends
    });

    await newEvent.save();
    await newEvent.populate('creator', 'fullName username profilePic');

    res.status(201).json(newEvent);
  } catch (error) {
    console.log("Error in createEvent:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:eventId", protectRoute, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { 
      title, 
      description, 
      date, 
      endDate,
      category, 
      maxAttendees,
      isPrivate,
      venue,
      tags,
      image 
    } = req.body;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.creator.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only edit your own events" });
    }

    if (!title || !description || !date) {
      return res.status(400).json({ message: "Title, description, and date are required" });
    }

    // Check if date is in the future
    const eventDate = new Date(date);
    if (eventDate <= new Date()) {
      return res.status(400).json({ message: "Event date must be in the future" });
    }

    let imageUrl = event.image; // Keep existing image by default
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const updateData = {
      title,
      description,
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : null,
      category: category || 'other',
      maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
      isPrivate: isPrivate || false,
      'location.venue': venue || "",
      tags: tags || [],
      image: imageUrl
    };

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      updateData,
      { new: true }
    ).populate('creator', 'fullName username profilePic');

    // Add attendee count for response
    const eventData = {
      ...updatedEvent.toObject(),
      attendeeCount: updatedEvent.attendeeCount
    };

    res.status(200).json(eventData);
  } catch (error) {
    console.log("Error in updateEvent:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get events near user's search location
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
    const radiusInMeters = radiusInMiles * 1609.34;

    if (!searchLocation || searchLocation[0] === 0) {
      return res.status(400).json({ message: "Location not set. Please update your location in settings." });
    }

    const events = await Event.aggregate([
      {
        $geoNear: {
        near: {
            type: "Point",
            coordinates: searchLocation
        },
        distanceField: "distance",
        maxDistance: radiusInMeters,
        spherical: true,
        query: {
            date: { $gte: new Date() },
            isPrivate: false
        }
        }
    },
      { $sort: { date: 1 } }, // Sort by event date
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "creator",
          foreignField: "_id",
          as: "creator",
          pipeline: [
            { $project: { fullName: 1, username: 1, profilePic: 1 } }
          ]
        }
      },
      {
        $addFields: {
          creator: { $arrayElemAt: ["$creator", 0] },
          distanceInMiles: { $divide: ["$distance", 1609.34] },
          attendeeCount: {
            $size: {
              $filter: {
                input: "$attendees",
                cond: { $eq: ["$$this.status", "yes"] }
              }
            }
          }
        }
      }
    ]);

    res.status(200).json(events);
  } catch (error) {
    console.log("Error in getNearbyEvents:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/my-events", protectRoute, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = req.user;
    const userLocation = user.currentCity.coordinates;

    if (!userLocation || userLocation[0] === 0) {
      return res.status(400).json({ message: "Location not set. Please update your location in settings." });
    }

    const events = await Event.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: userLocation
          },
          distanceField: "distance",
          spherical: true
        }
      },
      { $sort: { date: 1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "creator",
          foreignField: "_id",
          as: "creator",
          pipeline: [
            { $project: { fullName: 1, username: 1, profilePic: 1 } }
          ]
        }
      },
      {
        $addFields: {
          creator: { $arrayElemAt: ["$creator", 0] },
          distanceInMiles: { $divide: ["$distance", 1609.34] },
          attendeeCount: {
            $size: {
              $filter: {
                input: "$attendees",
                cond: { $eq: ["$$this.status", "yes"] }
              }
            }
          }
        }
      }
    ]);

    // Add userRSVP field for each event
    const eventsWithUserStatus = events.map(event => ({
      ...event,
      userRSVP: 'yes' // Since these are events the user is attending
    }));

    res.status(200).json(eventsWithUserStatus);
  } catch (error) {
    console.log("Error in getMyEvents:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get single event by ID
router.get("/:eventId", protectRoute, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId)
      .populate('creator', 'fullName username profilePic')
      .populate('attendees.user', 'fullName username profilePic');

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const eventData = {
      ...event.toObject(),
      userRSVP: event.isUserAttending(userId),
      attendeeCount: event.attendeeCount
    };

    res.status(200).json(eventData);
  } catch (error) {
    console.log("Error in getEvent:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// RSVP to an event
router.post("/:eventId/rsvp", protectRoute, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body; // 'yes', 'no', 'maybe'
    const userId = req.user._id;

    if (!['yes', 'no', 'maybe'].includes(status)) {
      return res.status(400).json({ message: "Invalid RSVP status" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if event is at capacity (only for 'yes' RSVP)
    if (status === 'yes' && event.maxAttendees) {
      const currentAttendees = event.attendees.filter(a => a.status === 'yes').length;
      if (currentAttendees >= event.maxAttendees) {
        return res.status(400).json({ message: "Event is at capacity" });
      }
    }

    // Find existing RSVP or create new one
    const existingRSVP = event.attendees.find(a => a.user.toString() === userId.toString());
    
    if (existingRSVP) {
      existingRSVP.status = status;
      existingRSVP.rsvpDate = new Date();
    } else {
      event.attendees.push({
        user: userId,
        status,
        rsvpDate: new Date()
      });
    }

    await event.save();

    // Create notification for event creator (if not own event)
    if (event.creator.toString() !== userId.toString() && status === 'yes') {
      const notification = new Notification({
        recipient: event.creator,
        sender: userId,
        type: 'event_rsvp',
        message: `${req.user.username} is attending your event "${event.title}"`,
        relatedEvent: eventId
      });
      await notification.save();
    }

    res.status(200).json({ 
      message: `RSVP updated to ${status}`,
      userRSVP: status,
      attendeeCount: event.attendees.filter(a => a.status === 'yes').length
    });
  } catch (error) {
    console.log("Error in rsvpEvent:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Invite user to event
router.post("/:eventId/invite", protectRoute, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId: inviteeId } = req.body;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user has permission to invite (creator or attendee)
    const userRSVP = event.isUserAttending(userId);
    if (event.creator.toString() !== userId.toString() && userRSVP !== 'yes') {
      return res.status(403).json({ message: "You must be attending the event to invite others" });
    }

    // Create notification for invitee
    const notification = new Notification({
      recipient: inviteeId,
      sender: userId,
      type: 'event_invite',
      message: `${req.user.username} invited you to "${event.title}"`,
      relatedEvent: eventId
    });
    await notification.save();

    res.status(200).json({ message: "Invitation sent successfully" });
  } catch (error) {
    console.log("Error in inviteToEvent:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete event (creator only)
router.delete("/:eventId", protectRoute, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.creator.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only delete your own events" });
    }

    await Event.findByIdAndDelete(eventId);
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.log("Error in deleteEvent:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;