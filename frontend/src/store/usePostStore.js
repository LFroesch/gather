import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const usePostStore = create((set, get) => ({
  posts: [],
  followingPosts: [],
  nearbyPosts: [],
  userPosts: [],
  isLoading: false,
  isCreating: false,
  lastFetchParams: null,

  // Create a new post
  createPost: async (postData) => {
    set({ isCreating: true });
    try {
      const res = await axiosInstance.post("/posts", postData);
      
      // Add new post to relevant feeds
      set((state) => ({
        posts: [res.data, ...state.posts],
        userPosts: [res.data, ...state.userPosts]
      }));
      
      toast.success("Post created successfully!");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create post");
      throw error;
    } finally {
      set({ isCreating: false });
    }
  },

  // Get following feed
  getFollowingPosts: async (page = 1) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get(`/posts/following?page=${page}&limit=10`);
      
      set({ lastFetchParams: { type: 'following', page } });
      
      if (page === 1) {
        set({ followingPosts: res.data });
      } else {
        set((state) => ({
          followingPosts: [...state.followingPosts, ...res.data]
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load posts");
    } finally {
      set({ isLoading: false });
    }
  },

  // Get nearby posts
  getNearbyPosts: async (page = 1, forceRefresh = false) => {
    // If it's a forced refresh (location/radius changed), reset page to 1
    if (forceRefresh) {
      page = 1;
    }

    set({ isLoading: true });
    try {
      const res = await axiosInstance.get(`/posts/nearby?page=${page}&limit=10`);
      
      set({ lastFetchParams: { type: 'nearby', page } });
      
      if (page === 1 || forceRefresh) {
        set({ nearbyPosts: res.data });
      } else {
        set((state) => ({
          nearbyPosts: [...state.nearbyPosts, ...res.data]
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load nearby posts");
    } finally {
      set({ isLoading: false });
    }
  },

  // Get user's posts
  getUserPosts: async (userId, page = 1) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get(`/posts/user/${userId}?page=${page}&limit=10`);
      
      set({ lastFetchParams: { type: 'user', userId, page } });
      
      if (page === 1) {
        set({ userPosts: res.data });
      } else {
        set((state) => ({
          userPosts: [...state.userPosts, ...res.data]
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load user posts");
    } finally {
      set({ isLoading: false });
    }
  },

  // Refetch current data (useful when location changes)
  refetchCurrentPosts: async () => {
    const { lastFetchParams } = get();
    if (!lastFetchParams) return;

    if (lastFetchParams.type === 'nearby') {
      await get().getNearbyPosts(1, true);
    } else if (lastFetchParams.type === 'following') {
      await get().getFollowingPosts(1);
    } else if (lastFetchParams.type === 'user') {
      await get().getUserPosts(lastFetchParams.userId, 1);
    }
  },

  // Like/unlike a post
  toggleLike: async (postId) => {
    try {
      const res = await axiosInstance.post(`/posts/${postId}/like`);
      
      // Update like status in all relevant arrays
      const updatePost = (post) => {
        if (post._id === postId) {
          return {
            ...post,
            likes: res.data.likes // Use the likes array from the backend response
          };
        }
        return post;
      };

      set((state) => ({
        posts: state.posts.map(updatePost),
        followingPosts: state.followingPosts.map(updatePost),
        nearbyPosts: state.nearbyPosts.map(updatePost),
        userPosts: state.userPosts.map(updatePost)
      }));

      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to toggle like");
      throw error;
    }
  },

  // Delete a post
  deletePost: async (postId) => {
    try {
      await axiosInstance.delete(`/posts/${postId}`);
      
      // Remove post from all arrays
      set((state) => ({
        posts: state.posts.filter(post => post._id !== postId),
        followingPosts: state.followingPosts.filter(post => post._id !== postId),
        nearbyPosts: state.nearbyPosts.filter(post => post._id !== postId),
        userPosts: state.userPosts.filter(post => post._id !== postId)
      }));

      toast.success("Post deleted successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete post");
      throw error;
    }
  },

  // Clear posts (for feed switching)
  clearPosts: () => {
    set({
      posts: [],
      followingPosts: [],
      nearbyPosts: [],
      userPosts: [],
      lastFetchParams: null
    });
  },

  // Initialize location change listener for posts
  initLocationListener: () => {
    const handleLocationChange = () => {
      // Automatically refetch nearby posts when location changes
      get().refetchCurrentPosts();
    };

    const handleLocationSettingsChange = () => {
      // Refetch when radius or other settings change
      get().refetchCurrentPosts();
    };

    window.addEventListener('locationChanged', handleLocationChange);
    window.addEventListener('locationSettingsChanged', handleLocationSettingsChange);

    // Return cleanup function
    return () => {
      window.removeEventListener('locationChanged', handleLocationChange);
      window.removeEventListener('locationSettingsChanged', handleLocationSettingsChange);
    };
  }
}));