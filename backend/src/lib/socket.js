import { Server } from "socket.io";
import http from "http";
import express from "express";
import { Notification } from "../models/follow.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle real-time notifications
  socket.on("sendNotification", async (notificationData) => {
    try {
      const { recipientId, type, message, relatedPost, relatedEvent } = notificationData;
      
      // Create notification in database
      const notification = new Notification({
        recipient: recipientId,
        sender: userId,
        type,
        message,
        relatedPost,
        relatedEvent
      });
      await notification.save();
      await notification.populate('sender', 'fullName username profilePic');

      // Send real-time notification to recipient if online
      const recipientSocketId = getReceiverSocketId(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("newNotification", notification);
      }
    } catch (error) {
      console.log("Error in sendNotification:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };