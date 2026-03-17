import { create } from 'zustand';
import toast from 'react-hot-toast';
import { axiosInstance } from '../lib/axios.js';

export const useAdminStore = create((set, get) => ({
  dashboardStats: null,
  users: [],
  songs: [],
  analytics: null,
  usersPagination: null,
  songsPagination: null,
  isLoading: false,

  // Check if current user is admin
  isAdmin: (user) => {
    return user?.role === 'admin' || user?.role === 'moderator';
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get('/admin/dashboard');
      set({ 
        dashboardStats: response.data,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch dashboard stats');
      set({ isLoading: false });
    }
  },

  // Get users with pagination
  getUsers: async (page = 1, limit = 20, role = 'all', search = '') => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      if (limit) params.append('limit', limit);
      if (role && role !== 'all') params.append('role', role);
      if (search) params.append('search', search);

      const response = await axiosInstance.get(`/admin/users?${params}`);
      set({ 
        users: response.data.users,
        usersPagination: response.data.pagination,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch users');
      set({ isLoading: false });
    }
  },

  // Update user role
  updateUserRole: async (userId, role) => {
    try {
      const response = await axiosInstance.put(`/admin/users/${userId}/role`, { role });
      toast.success(response.data.message);
      
      // Update user in local state
      set(state => ({
        users: state.users.map(user => 
          user._id === userId ? { ...user, role } : user
        )
      }));
      
      return response.data.user;
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error(error.response?.data?.message || 'Failed to update user role');
      throw error;
    }
  },

  // Get songs with pagination
  getSongs: async (page = 1, limit = 20, search = '', sortBy = 'createdAt') => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      if (limit) params.append('limit', limit);
      if (search) params.append('search', search);
      if (sortBy) params.append('sortBy', sortBy);

      const response = await axiosInstance.get(`/admin/songs?${params}`);
      set({ 
        songs: response.data.songs,
        songsPagination: response.data.pagination,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching songs:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch songs');
      set({ isLoading: false });
    }
  },

  // Delete song
  deleteSong: async (songId) => {
    try {
      const response = await axiosInstance.delete(`/admin/songs/${songId}`);
      toast.success(response.data.message);
      
      // Remove song from local state
      set(state => ({
        songs: state.songs.filter(song => song._id !== songId)
      }));
    } catch (error) {
      console.error('Error deleting song:', error);
      toast.error(error.response?.data?.message || 'Failed to delete song');
      throw error;
    }
  },

  // Toggle song status
  toggleSongStatus: async (songId) => {
    try {
      const response = await axiosInstance.put(`/admin/songs/${songId}/toggle`);
      toast.success(response.data.message);
      
      // Update song in local state
      set(state => ({
        songs: state.songs.map(song => 
          song._id === songId ? { ...song, isActive: !song.isActive } : song
        )
      }));
      
      return response.data.song;
    } catch (error) {
      console.error('Error toggling song status:', error);
      toast.error(error.response?.data?.message || 'Failed to update song status');
      throw error;
    }
  },

  // Reports
  reports: [],
  reportsPagination: null,

  getReports: async (page = 1, status = 'all', contentType = 'all') => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (status !== 'all') params.append('status', status);
      if (contentType !== 'all') params.append('contentType', contentType);
      const response = await axiosInstance.get(`/reports?${params}`);
      set({ reports: response.data.reports, reportsPagination: response.data.pagination, isLoading: false });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch reports');
      set({ isLoading: false });
    }
  },

  reviewReport: async (reportId, status, deleteContent = false, banUser = false) => {
    try {
      const response = await axiosInstance.put(`/reports/${reportId}`, { status, deleteContent, banUser });
      toast.success(response.data.message);
      set(state => ({
        reports: state.reports.map(r => r._id === reportId ? { ...r, status } : r)
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to review report');
      throw error;
    }
  },

  // Ban/unban users
  banUser: async (userId) => {
    try {
      const response = await axiosInstance.put(`/admin/users/${userId}/ban`);
      toast.success(response.data.message);
      set(state => ({
        users: state.users.map(u => u._id === userId ? { ...u, isBanned: true } : u)
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to ban user');
      throw error;
    }
  },

  unbanUser: async (userId) => {
    try {
      const response = await axiosInstance.put(`/admin/users/${userId}/unban`);
      toast.success(response.data.message);
      set(state => ({
        users: state.users.map(u => u._id === userId ? { ...u, isBanned: false } : u)
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to unban user');
      throw error;
    }
  },

  // Poll management
  adminPolls: [],
  adminPollsPagination: null,

  getAdminPolls: async (page = 1, status = 'all') => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (status !== 'all') params.append('status', status);
      const response = await axiosInstance.get(`/admin/polls?${params}`);
      set({ adminPolls: response.data.polls, adminPollsPagination: response.data.pagination, isLoading: false });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch polls');
      set({ isLoading: false });
    }
  },

  updatePollStatus: async (pollId, status) => {
    try {
      const response = await axiosInstance.put(`/admin/polls/${pollId}/status`, { status });
      toast.success(response.data.message);
      set(state => ({
        adminPolls: state.adminPolls.map(p => p._id === pollId ? { ...p, status } : p)
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update poll');
      throw error;
    }
  },

  deleteAdminPoll: async (pollId) => {
    try {
      await axiosInstance.delete(`/admin/polls/${pollId}`);
      toast.success('Poll deleted');
      set(state => ({
        adminPolls: state.adminPolls.filter(p => p._id !== pollId)
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete poll');
      throw error;
    }
  },

  // Get voting analytics
  getAnalytics: async (days = 7) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get(`/admin/analytics?days=${days}`);
      set({ 
        analytics: response.data,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch analytics');
      set({ isLoading: false });
    }
  }
}));