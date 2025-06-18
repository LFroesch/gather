import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useLocationStore = create((set, get) => ({
  currentLocation: null,
  locationSettings: null,
  isLoading: false,
  isUpdating: false,

  // Update user's current location
  updateCurrentLocation: async (locationData) => {
    set({ isUpdating: true });
    try {
      const res = await axiosInstance.put("/geo/current-location", locationData);
      set({ currentLocation: res.data.currentCity });
      toast.success("Location updated successfully!");
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('locationChanged', { 
        detail: res.data.currentCity 
      }));
      
      return res.data.currentCity;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update current location");
      throw error;
    } finally {
      set({ isUpdating: false });
    }
  },

  // Get location settings
  getLocationSettings: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/geo/settings");
      set({ 
        locationSettings: res.data.locationSettings,
        currentLocation: res.data.currentCity
      });
      return res.data;
    } catch (error) {
      toast.error("Failed to load location settings");
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Update location settings
  updateLocationSettings: async (settings) => {
    set({ isUpdating: true });
    try {
      const res = await axiosInstance.put("/geo/settings", settings);
      set({ locationSettings: res.data.locationSettings });
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('locationSettingsChanged', { 
        detail: res.data.locationSettings 
      }));
      
      return res.data.locationSettings;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update location settings");
      throw error;
    } finally {
      set({ isUpdating: false });
    }
  },

  // Search cities for autocomplete
  searchCities: async (query) => {
    if (!query || query.length < 2) return [];
    
    try {
      const res = await axiosInstance.get(`/geo/search-cities?query=${encodeURIComponent(query)}`);
      return res.data;
    } catch (error) {
      console.log("Error searching cities:", error);
      return [];
    }
  },

  // Calculate distance between two points
  calculateDistance: async (point1, point2) => {
    try {
      const res = await axiosInstance.post("/geo/calculate-distance", { point1, point2 });
      return res.data;
    } catch (error) {
      console.log("Error calculating distance:", error);
      return null;
    }
  },

  // Format distance for display
  formatDistance: (distanceInMiles) => {
    if (distanceInMiles < 0.1) return "< 0.1 mi";
    if (distanceInMiles < 1) return `${(distanceInMiles * 10) / 10} mi`;
    if (distanceInMiles < 10) return `${Math.round(distanceInMiles * 10) / 10} mi`;
    return `${Math.round(distanceInMiles)} mi`;
  },

  // Check if location is set
  isLocationSet: () => {
    const { currentLocation } = get();
    return currentLocation && currentLocation.city && currentLocation.coordinates && currentLocation.coordinates[0] !== 0;
  },

  // Initialize location on app start
  initializeLocation: async () => {
    try {
      // Get saved settings
      await get().getLocationSettings();
    } catch (error) {
      console.log("Location initialization failed:", error);
    }
  }
}));