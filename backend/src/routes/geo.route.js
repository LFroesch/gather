import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import User from '../models/user.model.js';

const router = express.Router();

// Update user's current location
router.put("/current-location", protectRoute, async (req, res) => {
  try {
    const { city, state, country, coordinates } = req.body;
    const userId = req.user._id;

    if (!city || !state || !country || !coordinates || coordinates.length !== 2) {
      return res.status(400).json({ 
        message: "City, state, country, and coordinates [lng, lat] are required" 
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        currentCity: {
          city,
          state,
          country,
          coordinates
        }
      },
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: "Current location updated successfully",
      currentCity: updatedUser.currentCity
    });
  } catch (error) {
    console.log("Error in updateCurrentLocation:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update user's location settings
router.put("/settings", protectRoute, async (req, res) => {
  try {
    const { 
      searchLocation, 
      nearMeRadius, 
      autoDetectLocation 
    } = req.body;
    const userId = req.user._id;

    const updateData = {};

    if (searchLocation) {
      const { city, state, country, coordinates } = searchLocation;
      if (!city || !state || !country || !coordinates || coordinates.length !== 2) {
        return res.status(400).json({ 
          message: "Search location must include city, state, country, and coordinates [lng, lat]" 
        });
      }
      updateData['locationSettings.searchLocation'] = {
        city,
        state,
        country,
        coordinates
      };
    }

    if (nearMeRadius !== undefined) {
      if (nearMeRadius < 5 || nearMeRadius > 100) {
        return res.status(400).json({ 
          message: "Near me radius must be between 5 and 100 miles" 
        });
      }
      updateData['locationSettings.nearMeRadius'] = nearMeRadius;
    }

    if (autoDetectLocation !== undefined) {
      updateData['locationSettings.autoDetectLocation'] = autoDetectLocation;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: "Location settings updated successfully",
      locationSettings: updatedUser.locationSettings
    });
  } catch (error) {
    console.log("Error in updateLocationSettings:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user's location settings
router.get("/settings", protectRoute, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId).select('locationSettings currentCity');
    
    res.status(200).json({
      locationSettings: user.locationSettings,
      currentCity: user.currentCity
    });
  } catch (error) {
    console.log("Error in getLocationSettings:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Search cities (for autocomplete)
router.get("/search-cities", protectRoute, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ message: "Query must be at least 2 characters" });
    }

    // This is a simplified city search. In production, you'd want to use:
    // - A proper geocoding service (Google Places, Mapbox, etc.)
    // - A comprehensive city database
    // For now, returning mock data
    const mockCities = [
      { city: "San Francisco", state: "CA", country: "USA", coordinates: [-122.4194, 37.7749] },
      { city: "Los Angeles", state: "CA", country: "USA", coordinates: [-118.2437, 34.0522] },
      { city: "New York", state: "NY", country: "USA", coordinates: [-74.0060, 40.7128] },
      { city: "Chicago", state: "IL", country: "USA", coordinates: [-87.6298, 41.8781] },
      { city: "Austin", state: "TX", country: "USA", coordinates: [-97.7431, 30.2672] },
      { city: "Seattle", state: "WA", country: "USA", coordinates: [-122.3321, 47.6062] },
      { city: "Denver", state: "CO", country: "USA", coordinates: [-104.9903, 39.7392] },
      { city: "Miami", state: "FL", country: "USA", coordinates: [-80.1918, 25.7617] }
    ];

    const filteredCities = mockCities.filter(city => 
      city.city.toLowerCase().includes(query.toLowerCase()) ||
      city.state.toLowerCase().includes(query.toLowerCase())
    );

    res.status(200).json(filteredCities);
  } catch (error) {
    console.log("Error in searchCities:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Reverse geocode coordinates to city
router.post("/reverse-geocode", protectRoute, async (req, res) => {
  try {
    const { coordinates } = req.body;
    
    if (!coordinates || coordinates.length !== 2) {
      return res.status(400).json({ message: "Coordinates [lng, lat] are required" });
    }

    // This is a mock reverse geocoding function
    // In production, you'd use a real geocoding service
    const mockReverseGeocode = (lng, lat) => {
      // Very simplified - you'd call an actual geocoding API here
      if (lng >= -125 && lng <= -114 && lat >= 32 && lat <= 42) {
        return { city: "San Francisco", state: "CA", country: "USA" };
      }
      if (lng >= -119 && lng <= -117 && lat >= 33 && lat <= 35) {
        return { city: "Los Angeles", state: "CA", country: "USA" };
      }
      // Default fallback
      return { city: "Unknown City", state: "Unknown", country: "USA" };
    };

    const [lng, lat] = coordinates;
    const locationData = mockReverseGeocode(lng, lat);

    res.status(200).json({
      ...locationData,
      coordinates
    });
  } catch (error) {
    console.log("Error in reverseGeocode:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Calculate distance between two points
router.post("/calculate-distance", protectRoute, async (req, res) => {
  try {
    const { point1, point2 } = req.body;
    
    if (!point1 || !point2 || point1.length !== 2 || point2.length !== 2) {
      return res.status(400).json({ 
        message: "Two coordinate pairs [lng, lat] are required" 
      });
    }

    // Haversine formula to calculate distance between two points
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 3959; // Earth's radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const [lng1, lat1] = point1;
    const [lng2, lat2] = point2;
    
    const distanceMiles = calculateDistance(lat1, lng1, lat2, lng2);
    const distanceKm = distanceMiles * 1.60934;

    res.status(200).json({
      distanceMiles: Math.round(distanceMiles * 10) / 10,
      distanceKm: Math.round(distanceKm * 10) / 10
    });
  } catch (error) {
    console.log("Error in calculateDistance:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;