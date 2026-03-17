import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useFriendStore = create((set, get) => ({
  friendStatus: {}, // { userId: 'none' | 'pending_sent' | 'pending_received' | 'friends' }
  canMessage: {},   // { userId: boolean }
  incomingRequests: [],
  friends: [],
  isProcessing: false,

  checkFriendStatus: async (userId) => {
    try {
      const res = await axiosInstance.get(`/friends/status/${userId}`);
      set((state) => ({
        friendStatus: { ...state.friendStatus, [userId]: res.data.status },
        canMessage: { ...state.canMessage, [userId]: res.data.canMessage }
      }));
      return res.data;
    } catch (error) {
      console.error("Error checking friend status:", error);
      return { status: 'none', canMessage: false };
    }
  },

  sendFriendRequest: async (userId) => {
    set({ isProcessing: true });
    try {
      await axiosInstance.post(`/friends/request/${userId}`);
      set((state) => ({
        friendStatus: { ...state.friendStatus, [userId]: 'pending_sent' }
      }));
      toast.success("Friend request sent!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send friend request", { id: "friend-error" });
    } finally {
      set({ isProcessing: false });
    }
  },

  acceptFriendRequest: async (userId) => {
    set({ isProcessing: true });
    try {
      await axiosInstance.post(`/friends/accept/${userId}`);
      set((state) => ({
        friendStatus: { ...state.friendStatus, [userId]: 'friends' },
        canMessage: { ...state.canMessage, [userId]: true },
        incomingRequests: state.incomingRequests.filter(r => r.requester._id !== userId)
      }));
      toast.success("Friend request accepted!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept request", { id: "friend-error" });
    } finally {
      set({ isProcessing: false });
    }
  },

  rejectFriendRequest: async (userId) => {
    set({ isProcessing: true });
    try {
      await axiosInstance.post(`/friends/reject/${userId}`);
      set((state) => ({
        friendStatus: { ...state.friendStatus, [userId]: 'none' },
        incomingRequests: state.incomingRequests.filter(r => r.requester._id !== userId)
      }));
      toast.success("Friend request declined");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject request", { id: "friend-error" });
    } finally {
      set({ isProcessing: false });
    }
  },

  cancelFriendRequest: async (userId) => {
    set({ isProcessing: true });
    try {
      await axiosInstance.post(`/friends/cancel/${userId}`);
      set((state) => ({
        friendStatus: { ...state.friendStatus, [userId]: 'none' }
      }));
      toast.success("Friend request cancelled");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel request", { id: "friend-error" });
    } finally {
      set({ isProcessing: false });
    }
  },

  removeFriend: async (userId) => {
    set({ isProcessing: true });
    try {
      await axiosInstance.delete(`/friends/remove/${userId}`);
      set((state) => ({
        friendStatus: { ...state.friendStatus, [userId]: 'none' },
        canMessage: { ...state.canMessage, [userId]: false },
        friends: state.friends.filter(f => f._id !== userId)
      }));
      toast.success("Friend removed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove friend", { id: "friend-error" });
    } finally {
      set({ isProcessing: false });
    }
  },

  getFriends: async (userId) => {
    try {
      const res = await axiosInstance.get(`/friends/list/${userId}`);
      set({ friends: res.data.friends });
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load friends", { id: "friend-error" });
    }
  },

  getIncomingRequests: async () => {
    try {
      const res = await axiosInstance.get("/friends/requests");
      set({ incomingRequests: res.data });
      return res.data;
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    }
  }
}));
