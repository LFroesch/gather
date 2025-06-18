import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useFollowStore = create((set, get) => ({
  followingStatus: {}, // {userId: boolean}
  isFollowing: false,

  // Follow a user
  followUser: async (userId) => {
    set({ isFollowing: true });
    try {
      await axiosInstance.post(`/follow/follow/${userId}`);
      
      set((state) => ({
        followingStatus: {
          ...state.followingStatus,
          [userId]: true
        }
      }));

      toast.success("User followed successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to follow user");
      throw error;
    } finally {
      set({ isFollowing: false });
    }
  },

  // Unfollow a user
  unfollowUser: async (userId) => {
    set({ isFollowing: true });
    try {
      await axiosInstance.post(`/follow/unfollow/${userId}`);
      
      set((state) => ({
        followingStatus: {
          ...state.followingStatus,
          [userId]: false
        }
      }));

      toast.success("User unfollowed successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to unfollow user");
      throw error;
    } finally {
      set({ isFollowing: false });
    }
  },

  // Check follow status
  checkFollowStatus: async (userId) => {
    try {
      const res = await axiosInstance.get(`/follow/status/${userId}`);
      
      set((state) => ({
        followingStatus: {
          ...state.followingStatus,
          [userId]: res.data.isFollowing
        }
      }));

      return res.data.isFollowing;
    } catch (error) {
      console.log("Error checking follow status:", error);
      return false;
    }
  },

  // Get followers
  getFollowers: async (userId, page = 1) => {
    try {
      const res = await axiosInstance.get(`/follow/followers/${userId}?page=${page}&limit=20`);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load followers");
      throw error;
    }
  },

  // Get following
  getFollowing: async (userId, page = 1) => {
    try {
      const res = await axiosInstance.get(`/follow/following/${userId}?page=${page}&limit=20`);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load following");
      throw error;
    }
  }
}));

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  // Get notifications
  getNotifications: async (page = 1) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get(`/follow/notifications?page=${page}&limit=20`);
      
      if (page === 1) {
        set({ 
          notifications: res.data.notifications,
          unreadCount: res.data.unreadCount
        });
      } else {
        set((state) => ({
          notifications: [...state.notifications, ...res.data.notifications]
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load notifications");
    } finally {
      set({ isLoading: false });
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      await axiosInstance.put(`/follow/notifications/${notificationId}/read`);
      
      set((state) => ({
        notifications: state.notifications.map(notification =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to mark as read");
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      await axiosInstance.put("/follow/notifications/read-all");
      
      set((state) => ({
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true
        })),
        unreadCount: 0
      }));

      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to mark all as read");
    }
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      await axiosInstance.delete(`/follow/notifications/${notificationId}`);
      
      set((state) => {
        const notification = state.notifications.find(n => n._id === notificationId);
        return {
          notifications: state.notifications.filter(n => n._id !== notificationId),
          unreadCount: notification && !notification.isRead 
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount
        };
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete notification");
    }
  },

  // Add new notification (for real-time)
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },

  // Clear notifications
  clearNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0
    });
  }
}));