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
      nearMeRadius
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

// Search cities using OpenStreetMap Nominatim (FREE) - Limited to USA/North America
router.get("/search-cities", protectRoute, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters" });
    }

    // Use Nominatim API for real city search - Limited to North America
    const encodedQuery = encodeURIComponent(query);
    
    // Option 1: Limit to specific countries (USA, Canada, Mexico)
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&countrycodes=us&limit=10&addressdetails=1&featuretype=city`;
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'EventChatApp/1.0' // Nominatim requires a User-Agent
      }
    });
    
    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }
    
    const data = await response.json();
    
    // Transform the data to our format and filter for North American countries
    const allowedCountries = ['United States', 'Canada', 'Mexico', 'US', 'USA'];
    
    const cities = data
      .filter(item => {
        // Filter for cities, towns, villages, etc.
        const placeTypes = ['city', 'town', 'village', 'municipality', 'borough'];
        const hasValidType = item.addresstype && (
          placeTypes.includes(item.addresstype) || 
          placeTypes.includes(item.type) ||
          item.address?.city || 
          item.address?.town || 
          item.address?.village
        );
        
        // Additional filter for North American countries
        const country = item.address?.country || '';
        const isNorthAmerica = allowedCountries.some(allowed => 
          country.toLowerCase().includes(allowed.toLowerCase())
        );
        
        return hasValidType && isNorthAmerica;
      })
      .map(item => {
        const address = item.address || {};
        
        // Extract city name
        let city = address.city || address.town || address.village || address.municipality || address.borough;
        
        // If no city found, try to extract from display_name
        if (!city) {
          const parts = item.display_name.split(',');
          city = parts[0].trim();
        }
        
        // Extract state/province
        let state = address.state || address.province || address.region || address.county;
        
        // Extract country
        let country = address.country || 'Unknown';
        
        // Convert coordinates to our format [lng, lat]
        const coordinates = [parseFloat(item.lon), parseFloat(item.lat)];
        
        return {
          city: city || 'Unknown City',
          state: state || 'Unknown State',
          country,
          coordinates,
          displayName: item.display_name
        };
      })
      .filter(city => city.city !== 'Unknown City') // Remove entries without proper city names
      .slice(0, 8); // Limit to 8 results

    res.status(200).json(cities);
  } catch (error) {
    console.log("Error in searchCities:", error.message);
    
    // Fallback to mock data if geocoding fails (USA cities only)
    const { query } = req.query; // FIX: Access query from req.query here
    const mockCities = [
      { city: "San Francisco", state: "CA", country: "USA", coordinates: [-122.4194, 37.7749] },
      { city: "Los Angeles", state: "CA", country: "USA", coordinates: [-118.2437, 34.0522] },
      { city: "New York", state: "NY", country: "USA", coordinates: [-74.0060, 40.7128] },
      { city: "Chicago", state: "IL", country: "USA", coordinates: [-87.6298, 41.8781] },
      { city: "Austin", state: "TX", country: "USA", coordinates: [-97.7431, 30.2672] },
      { city: "Seattle", state: "WA", country: "USA", coordinates: [-122.3321, 47.6062] },
      { city: "Denver", state: "CO", country: "USA", coordinates: [-104.9903, 39.7392] },
      { city: "Miami", state: "FL", country: "USA", coordinates: [-80.1918, 25.7617] },
      { city: "Boston", state: "MA", country: "USA", coordinates: [-71.0588, 42.3601] },
      { city: "Portland", state: "OR", country: "USA", coordinates: [-122.6765, 45.5152] },
      { city: "Phoenix", state: "AZ", country: "USA", coordinates: [-112.0740, 33.4484] },
      { city: "Atlanta", state: "GA", country: "USA", coordinates: [-84.3880, 33.7490] },
    ].filter(city => 
      city.city.toLowerCase().includes(query.toLowerCase()) ||
      city.state.toLowerCase().includes(query.toLowerCase())
    );

    res.status(200).json(mockCities);
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