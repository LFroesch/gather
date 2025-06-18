import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useLocationStore = create((set, get) => ({
  currentLocation: null,
  locationSettings: null,
  isLoading: false,
  isUpdating: false,
  hasLocationPermission: false,

  // Get user's current position
  getCurrentPosition: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve([longitude, latitude]); // MongoDB format [lng, lat]
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error("Location access denied by user"));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error("Location information unavailable"));
              break;
            case error.TIMEOUT:
              reject(new Error("Location request timed out"));
              break;
            default:
              reject(new Error("An unknown error occurred"));
              break;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  },

  // Request location permission and get current location
  requestLocationPermission: async () => {
    try {
      const coordinates = await get().getCurrentPosition();
      set({ hasLocationPermission: true });
      
      // Reverse geocode to get city
      const locationData = await get().reverseGeocode(coordinates);
      await get().updateCurrentLocation(locationData);
      
      return locationData;
    } catch (error) {
      console.log("Location permission error:", error.message);
      toast.error(error.message);
      set({ hasLocationPermission: false });
      throw error;
    }
  },

  // Reverse geocode coordinates to city
  reverseGeocode: async (coordinates) => {
    try {
      const res = await axiosInstance.post("/geo/reverse-geocode", { coordinates });
      return {
        ...res.data,
        coordinates
      };
    } catch (error) {
      toast.error("Failed to get location details");
      throw error;
    }
  },

  // Update user's current location
  updateCurrentLocation: async (locationData) => {
    set({ isUpdating: true });
    try {
      const res = await axiosInstance.put("/geo/current-location", locationData);
      set({ currentLocation: res.data.currentCity });
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
      toast.success("Location settings updated successfully!");
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
      // First get saved settings
      await get().getLocationSettings();
      
      const { locationSettings } = get();
      
      // If auto-detect is enabled and no current location, try to get it
      if (locationSettings?.autoDetectLocation && !get().isLocationSet()) {
        try {
          await get().requestLocationPermission();
        } catch (error) {
          console.log("Auto location detection failed:", error.message);
        }
      }
    } catch (error) {
      console.log("Location initialization failed:", error);
    }
  }
}));