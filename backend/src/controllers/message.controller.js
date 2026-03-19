import cloudinary from "../lib/cloudinary.js";
import { validateImage } from "../lib/utils.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUser = await User.findById(req.user._id);
        const friendIds = loggedInUser.friends || [];

        if (friendIds.length === 0) {
            return res.status(200).json([]);
        }

        const friends = await User.find({ _id: { $in: friendIds } })
            .select("-password -__v")
            .lean();

        // Get last message timestamp per friend
        const lastMessages = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: req.user._id, receiverId: { $in: friendIds } },
                        { senderId: { $in: friendIds }, receiverId: req.user._id },
                    ],
                },
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$senderId", req.user._id] },
                            "$receiverId",
                            "$senderId",
                        ],
                    },
                    lastMessageAt: { $max: "$createdAt" },
                },
            },
        ]);

        const lastMessageMap = {};
        for (const entry of lastMessages) {
            lastMessageMap[entry._id.toString()] = entry.lastMessageAt;
        }

        const friendsWithLastMessage = friends.map((f) => ({
            ...f,
            lastMessageAt: lastMessageMap[f._id.toString()] || null,
        }));

        res.status(200).json(friendsWithLastMessage);
    } catch (error) {
        console.error("Error in getUsersForSidebar:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { id: senderId } = req.params;
    const myId = req.user._id;

    await Message.updateMany(
      { senderId, receiverId: myId, read: false },
      { read: true }
    );

    // Notify sender their messages were read
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", { readBy: myId.toString() });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in markMessagesAsRead:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUnreadCounts = async (req, res) => {
  try {
    const myId = req.user._id;

    const counts = await Message.aggregate([
      { $match: { receiverId: myId, read: false } },
      { $group: { _id: "$senderId", count: { $sum: 1 } } },
    ]);

    // Total unread across all conversations
    const total = counts.reduce((sum, c) => sum + c.count, 0);
    res.status(200).json({ total, perUser: counts });
  } catch (error) {
    console.error("Error in getUnreadCounts:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Check messaging permission
    const receiver = await User.findById(receiverId).select('messagingPreference friends');
    if (!receiver) return res.status(404).json({ error: "User not found" });

    if (receiver.messagingPreference === 'friends_only') {
      const isFriend = receiver.friends.some(id => id.toString() === senderId.toString());
      if (!isFriend) return res.status(403).json({ error: "This user only accepts messages from friends" });
    }

    let imageUrl;
    if (image) {
      const { valid, error } = validateImage(image);
      if (!valid) return res.status(400).json({ error });
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      ...(req.user.isDemo && { isDemo: true })
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};