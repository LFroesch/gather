import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useEventStore = create((set, get) => ({
  events: [],
  myEvents: [],
  nearbyEvents: [],
  selectedEvent: null,
  isLoading: false,
  isCreating: false,
  lastFetchParams: null,

  // Create a new event
  createEvent: async (eventData) => {
    set({ isCreating: true });
    try {
      const res = await axiosInstance.post("/events", eventData);
      
      // Add new event to relevant feeds
      set((state) => ({
        events: [res.data, ...state.events],
        myEvents: [res.data, ...state.myEvents]
      }));
      
      toast.success("Event created successfully!");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create event");
      throw error;
    } finally {
      set({ isCreating: false });
    }
  },

  // Get nearby events
  getNearbyEvents: async (page = 1, forceRefresh = false) => {
    // If it's a forced refresh (location/radius changed), reset page to 1
    if (forceRefresh) {
      page = 1;
    }

    set({ isLoading: true });
    try {
      const res = await axiosInstance.get(`/events/nearby?page=${page}&limit=10`);
      
      // Store fetch parameters for potential refetching
      set({ lastFetchParams: { type: 'nearby', page } });
      
      if (page === 1 || forceRefresh) {
        set({ nearbyEvents: res.data });
      } else {
        set((state) => ({
          nearbyEvents: [...state.nearbyEvents, ...res.data]
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load nearby events");
    } finally {
      set({ isLoading: false });
    }
  },

  // Get user's events (RSVPd yes)
  getMyEvents: async (page = 1) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get(`/events/my-events?page=${page}&limit=10`);
      
      // Store fetch parameters for potential refetching
      set({ lastFetchParams: { type: 'my', page } });
      
      if (page === 1) {
        set({ myEvents: res.data });
      } else {
        set((state) => ({
          myEvents: [...state.myEvents, ...res.data]
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load your events");
    } finally {
      set({ isLoading: false });
    }
  },

  // Refetch current data (useful when location changes)
  refetchCurrentEvents: async () => {
    const { lastFetchParams } = get();
    if (!lastFetchParams) return;

    if (lastFetchParams.type === 'nearby') {
      await get().getNearbyEvents(1, true);
    } else if (lastFetchParams.type === 'my') {
      await get().getMyEvents(1);
    }
  },

  // Get single event
  getEvent: async (eventId) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get(`/events/${eventId}`);
      set({ selectedEvent: res.data });
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load event");
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // RSVP to event
  rsvpToEvent: async (eventId, status) => {
    try {
      const res = await axiosInstance.post(`/events/${eventId}/rsvp`, { status });
      
      // Update event in all relevant arrays
      const updateEvent = (event) => {
        if (event._id === eventId) {
          return {
            ...event,
            userRSVP: status,
            attendeeCount: res.data.attendeeCount
          };
        }
        return event;
      };

      set((state) => ({
        events: state.events.map(updateEvent),
        nearbyEvents: state.nearbyEvents.map(updateEvent),
        myEvents: status === 'yes' 
          ? state.myEvents.map(updateEvent)
          : state.myEvents.filter(event => event._id !== eventId),
        selectedEvent: state.selectedEvent?._id === eventId 
          ? { ...state.selectedEvent, userRSVP: status, attendeeCount: res.data.attendeeCount }
          : state.selectedEvent
      }));

      toast.success(`RSVP updated to ${status}`);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update RSVP");
      throw error;
    }
  },

  // Invite user to event
  inviteToEvent: async (eventId, userId) => {
    try {
      await axiosInstance.post(`/events/${eventId}/invite`, { userId });
      toast.success("Invitation sent successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send invitation");
      throw error;
    }
  },

  // Delete event
  deleteEvent: async (eventId) => {
    try {
      await axiosInstance.delete(`/events/${eventId}`);
      
      // Remove event from all arrays
      set((state) => ({
        events: state.events.filter(event => event._id !== eventId),
        nearbyEvents: state.nearbyEvents.filter(event => event._id !== eventId),
        myEvents: state.myEvents.filter(event => event._id !== eventId),
        selectedEvent: state.selectedEvent?._id === eventId ? null : state.selectedEvent
      }));

      toast.success("Event deleted successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete event");
      throw error;
    }
  },

  // Clear events
  clearEvents: () => {
    set({
      events: [],
      myEvents: [],
      nearbyEvents: [],
      selectedEvent: null,
      lastFetchParams: null
    });
  },

  // Set selected event
  setSelectedEvent: (event) => {
    set({ selectedEvent: event });
  },

  // Initialize location change listener
  initLocationListener: () => {
    const handleLocationChange = () => {
      // Automatically refetch nearby events when location changes
      get().refetchCurrentEvents();
    };

    const handleLocationSettingsChange = () => {
      // Refetch when radius or other settings change
      get().refetchCurrentEvents();
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