import { create } from 'zustand';
import toast from 'react-hot-toast';
import { axiosInstance } from '../lib/axios.js';

export const useVotingStore = create((set, get) => ({
  songs: [],
  userHasVotedToday: false,
  votedSongId: null,
  dailyChart: null,
  votingStats: null,
  isLoading: false,
  isSubmittingVote: false,

  // Get today's songs
  getTodaysSongs: async () => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get('/voting/today');
      set({ 
        songs: response.data.songs,
        userHasVotedToday: response.data.userHasVotedToday,
        votedSongId: response.data.votedSongId,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching songs:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch songs');
      set({ isLoading: false });
    }
  },

  // Submit a new song
  submitSong: async (songData) => {
    try {
      const response = await axiosInstance.post('/voting/submit', songData);
      toast.success(response.data.message);
      
      // Refresh the songs list
      await get().getTodaysSongs();
      
      return response.data.song;
    } catch (error) {
      console.error('Error submitting song:', error);
      toast.error(error.response?.data?.message || 'Failed to submit song');
      throw error;
    }
  },

  // Vote for a song
  voteSong: async (songId, deviceFingerprint) => {
    set({ isSubmittingVote: true });
    try {
      const response = await axiosInstance.post(`/voting/vote/${songId}`, {
        deviceFingerprint
      });
      
      toast.success(response.data.message);
      
      // Update local state
      set(state => ({
        userHasVotedToday: true,
        votedSongId: songId,
        songs: state.songs.map(song => 
          song._id === songId 
            ? { ...song, dailyVoteCount: song.dailyVoteCount + 1, userHasVoted: true }
            : song
        ),
        isSubmittingVote: false
      }));
    } catch (error) {
      console.error('Error voting for song:', error);
      toast.error(error.response?.data?.message || 'Failed to vote');
      set({ isSubmittingVote: false });
      throw error;
    }
  },

  // Get daily chart
  getDailyChart: async (date) => {
    set({ isLoading: true });
    try {
      const endpoint = date ? `/voting/daily-chart/${date}` : '/voting/daily-chart';
      const response = await axiosInstance.get(endpoint);
      set({ 
        dailyChart: response.data,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching daily chart:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch chart');
      set({ isLoading: false });
    }
  },

  // Get voting stats
  getVotingStats: async () => {
    try {
      const response = await axiosInstance.get('/voting/stats');
      set({ votingStats: response.data });
    } catch (error) {
      console.error('Error fetching voting stats:', error);
    }
  },

  // Generate device fingerprint
  generateDeviceFingerprint: () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36);
  }
}));