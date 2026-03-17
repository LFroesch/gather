import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: JSON.parse(localStorage.getItem("chat-selected-user")) || null,
  isUsersLoading: false,
  isMessagesLoading: false,
  totalUnreadMessages: 0,
  perUserUnread: {}, // { senderId: count }

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  markAsRead: async (userId) => {
    try {
      await axiosInstance.put(`/messages/read/${userId}`);
      // Update local messages to show as read
      set({
        messages: get().messages.map((m) =>
          m.senderId === userId ? { ...m, read: true } : m
        ),
      });
      // Refresh unread counts
      get().getUnreadCounts();
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  },

  getUnreadCounts: async () => {
    try {
      const res = await axiosInstance.get("/messages/unread-counts");
      const perUser = {};
      for (const entry of res.data.perUser) {
        perUser[entry._id] = entry.count;
      }
      set({ totalUnreadMessages: res.data.total, perUserUnread: perUser });
    } catch (error) {
      console.error("Error getting unread counts:", error);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });

      // Auto-mark as read since we're viewing this conversation
      get().markAsRead(selectedUser._id);
    });

    // Listen for read receipts from the other user
    socket.on("messagesRead", ({ readBy }) => {
      if (readBy === selectedUser._id) {
        set({
          messages: get().messages.map((m) =>
            m.senderId !== readBy ? { ...m, read: true } : m
          ),
        });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messagesRead");
  },

  searchAllUsers: async (query) => {
    try {
      const res = await axiosInstance.get(`/auth/search?q=${encodeURIComponent(query)}`);
      return res.data;
    } catch (error) {
      return [];
    }
  },

  setSelectedUser: (selectedUser) => {
    if (selectedUser) {
      localStorage.setItem("chat-selected-user", JSON.stringify(selectedUser));
    } else {
      localStorage.removeItem("chat-selected-user");
    }
    set({ selectedUser });
  },
}));