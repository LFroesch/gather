import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { useLocationStore } from "../store/useLocationStore";
import { MapPin, Search, Save, Loader, Edit, X, Palette, Settings as SettingsIcon } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const {
    currentLocation,
    locationSettings,
    isLoading,
    isUpdating,
    getLocationSettings,
    updateLocationSettings,
    updateCurrentLocation,
    searchCities
  } = useLocationStore();

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [localRadius, setLocalRadius] = useState(25);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSection, setActiveSection] = useState('location');
  
  // Refs for cleanup
  const abortControllerRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    getLocationSettings();
  }, [getLocationSettings]);

  useEffect(() => {
    if (locationSettings?.nearMeRadius) {
      setLocalRadius(locationSettings.nearMeRadius);
    }
  }, [locationSettings]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsSearching(false);
    setSearchResults([]);
  }, []);

  // Debounced city search
  const handleCitySearch = useCallback((query) => {
    setCitySearch(query);
    cleanup();
    
    if (query.length >= 2) {
      setIsSearching(true);
      abortControllerRef.current = new AbortController();
      
      timeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchCities(query, abortControllerRef.current);
          
          if (!abortControllerRef.current?.signal.aborted) {
            setSearchResults(results);
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Search error:', error);
            setSearchResults([]);
          }
        } finally {
          setIsSearching(false);
        }
      }, 1500);
    } else {
      setSearchResults([]);
    }
  }, [searchCities, cleanup]);

  const handleSelectCity = async (city) => {
    try {
      await updateCurrentLocation({
        city: city.city,
        state: city.state,
        country: city.country,
        coordinates: city.coordinates
      });
      handleCloseEditModal();
    } catch (error) {
      console.error("Failed to update location:", error);
    }
  };

  const handleCloseEditModal = useCallback(() => {
    cleanup();
    setIsEditingLocation(false);
    setCitySearch("");
  }, [cleanup]);

  const handleRadiusChange = async (newRadius) => {
    setLocalRadius(newRadius);
    try {
      await updateLocationSettings({ nearMeRadius: newRadius });
      window.dispatchEvent(new CustomEvent('locationSettingsChanged'));
    } catch (error) {
      console.error("Failed to update radius:", error);
    }
  };

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const tabs = [
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'theme', label: 'Theme', icon: Palette }
  ];

  return (
    <div className="min-h-screen bg-base-200 pt-20">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <SettingsIcon className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-base-content/60">Customize your EventChat experience</p>
        </div>

        {/* Tab Navigation */}
        <div className="tabs tabs-boxed bg-base-100 shadow-lg mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab tab-lg gap-2 ${activeSection === tab.id ? 'tab-active' : ''}`}
                onClick={() => setActiveSection(tab.id)}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="bg-base-100 rounded-xl shadow-lg p-6">
          {/* Theme Section */}
          {activeSection === 'theme' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Theme Preferences</h2>
                <p className="text-base-content/60">Choose a theme that suits your style</p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {THEMES.map((t) => (
                  <button
                    key={t}
                    className={`group flex flex-col items-center gap-2 p-3 rounded-lg transition-all hover:scale-105 ${
                      theme === t 
                        ? "bg-primary/20 ring-2 ring-primary" 
                        : "hover:bg-base-200"
                    }`}
                    onClick={() => setTheme(t)}
                  >
                    <div className="h-12 w-full rounded-lg overflow-hidden shadow-sm" data-theme={t}>
                      <div className="h-full grid grid-cols-4 gap-px p-1">
                        <div className="rounded bg-primary"></div>
                        <div className="rounded bg-secondary"></div>
                        <div className="rounded bg-accent"></div>
                        <div className="rounded bg-neutral"></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-center capitalize">
                      {t}
                    </span>
                    {theme === t && (
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>

              {/* Theme Preview */}
              <div className="mt-8">
                <div className="bg-base-200 rounded-lg p-4">
                  <div className="max-w-md mx-auto bg-base-100 rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 bg-primary text-primary-content">
                      <h4 className="font-semibold">Sample Chat</h4>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-start">
                        <div className="bg-base-200 rounded-lg px-3 py-2 max-w-xs">
                          <p className="text-sm">Hey, how's the event planning going?</p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-primary text-primary-content rounded-lg px-3 py-2 max-w-xs">
                          <p className="text-sm">Great! Just finished setting up.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Location Section */}
          {activeSection === 'location' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Location Settings</h2>
                <p className="text-base-content/60">Configure how you discover events and posts</p>
              </div>

              {/* Current Location */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Current Location</h3>
                  {currentLocation?.city && (
                    <button
                      className="btn btn-outline btn-sm gap-2"
                      onClick={() => setIsEditingLocation(true)}
                    >
                      <Edit className="w-4 h-4" />
                      Change
                    </button>
                  )}
                </div>

                {currentLocation?.city ? (
                  <div className="flex items-center gap-4 p-4 bg-success/10 border border-success/20 rounded-lg">
                    <MapPin className="w-6 h-6 text-success" />
                    <div>
                      <p className="font-medium">{currentLocation.city}, {currentLocation.state}</p>
                      <p className="text-sm text-base-content/60">Your current location</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                    <MapPin className="w-6 h-6 text-warning" />
                    <div className="flex-1">
                      <p className="font-medium text-warning">No location set</p>
                      <p className="text-sm text-base-content/60">Set your location to discover events and posts</p>
                    </div>
                    <button 
                      className="btn btn-warning btn-sm gap-2" 
                      onClick={() => setIsEditingLocation(true)}
                    >
                      <Search className="w-4 h-4" />
                      Set Location
                    </button>
                  </div>
                )}

                {/* Location Search Modal */}
                {isEditingLocation && (
                  <div className="p-6 bg-base-200 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold">Set Your Location</h4>
                      <button
                        className="btn btn-ghost btn-sm btn-circle"
                        onClick={handleCloseEditModal}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="alert alert-info">
                      <Search className="w-5 h-5" />
                      <span>Search for your city (e.g., "San Francisco, CA")</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          className="input input-bordered w-full pr-10"
                          placeholder="Enter city name..."
                          value={citySearch}
                          onChange={(e) => handleCitySearch(e.target.value)}
                        />
                        {isSearching && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <Loader className="w-5 h-5 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                      
                      {searchResults.length > 0 && (
                        <div className="max-h-64 overflow-y-auto bg-base-100 rounded-lg border border-base-300">
                          {searchResults.map((city, index) => (
                            <button
                              key={index}
                              className="w-full p-4 text-left hover:bg-base-200 flex items-center gap-3 transition-colors border-b border-base-300 last:border-b-0"
                              onClick={() => handleSelectCity(city)}
                            >
                              <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                              <div>
                                <p className="font-medium">{city.city}, {city.state}</p>
                                <p className="text-sm text-base-content/60">{city.country}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {citySearch.length >= 2 && searchResults.length === 0 && !isSearching && (
                        <div className="p-4 text-center text-base-content/60 bg-base-100 rounded-lg border border-base-300">
                          No cities found for "{citySearch}"
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Search Radius */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Discovery Radius</h3>
                <p className="text-sm text-base-content/60">Drag to change search radius</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-base-content/60">5 miles</span>
                    <span className="font-semibold text-primary">{localRadius} miles</span>
                    <span className="text-sm text-base-content/60">100 miles</span>
                  </div>
                  <input
                    type="range"
                    className="range range-primary"
                    min="5"
                    max="100"
                    step="5"
                    value={localRadius}
                    onChange={(e) => {
                      const newRadius = parseInt(e.target.value);
                      setLocalRadius(newRadius);
                      handleRadiusChange(newRadius);
                    }}
                  />
                  <div className="text-center">
                    <p className="text-sm text-base-content/60">
                      Events and posts within {localRadius} miles will be shown
                    </p>
                  </div>
                </div>
              </div>

              {isUpdating && (
                <div className="flex items-center gap-3 p-4 bg-info/10 border border-info/20 rounded-lg">
                  <Loader className="w-5 h-5 animate-spin text-info" />
                  <span className="text-info font-medium">Updating location settings...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;