import { create } from 'zustand';
import toast from 'react-hot-toast';
import { axiosInstance } from '../lib/axios.js';

export const usePollStore = create((set, get) => ({
  polls: [],
  isLoading: false,
  filter: 'active',

  getPolls: async (filter) => {
    const f = filter || get().filter;
    set({ isLoading: true, filter: f });
    try {
      const res = await axiosInstance.get(`/polls?filter=${f}&limit=50`);
      set({ polls: res.data, isLoading: false });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load polls');
      set({ isLoading: false });
    }
  },

  createPoll: async (pollData) => {
    try {
      const res = await axiosInstance.post('/polls', pollData);
      // Only add to list if viewing "mine" tab (pending polls won't show in active/expired)
      const currentFilter = get().filter;
      if (currentFilter === 'mine') {
        set(state => ({ polls: [res.data, ...state.polls] }));
      }
      toast.success('Poll submitted for approval!');
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create poll');
      throw error;
    }
  },

  votePoll: async (pollId, optionIndex) => {
    try {
      const res = await axiosInstance.post(`/polls/${pollId}/vote`, { optionIndex });
      set(state => ({
        polls: state.polls.map(p =>
          p._id === pollId
            ? { ...p, ...res.data }
            : p
        )
      }));
      toast.success('Vote recorded!', { id: 'poll-vote' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to vote');
      throw error;
    }
  },

  deletePoll: async (pollId) => {
    try {
      await axiosInstance.delete(`/polls/${pollId}`);
      set(state => ({ polls: state.polls.filter(p => p._id !== pollId) }));
      toast.success('Poll deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete poll');
      throw error;
    }
  }
}));
