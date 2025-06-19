import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { useLocationStore } from "../store/useLocationStore";
import { Send, MapPin, Search, Save, Loader, Edit, X } from "lucide-react";
import { useEffect, useState } from "react";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];

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

  useEffect(() => {
    getLocationSettings();
  }, [getLocationSettings]);

  useEffect(() => {
    if (locationSettings?.nearMeRadius) {
      setLocalRadius(locationSettings.nearMeRadius);
    }
  }, [locationSettings]);

  const handleCitySearch = async (query) => {
    setCitySearch(query);
    if (query.length >= 2) {
      const results = await searchCities(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectCity = async (city) => {
    try {
      await updateCurrentLocation({
        city: city.city,
        state: city.state,
        country: city.country,
        coordinates: city.coordinates
      });
      setIsEditingLocation(false);
      setCitySearch("");
      setSearchResults([]);
    } catch (error) {
      console.error("Failed to update location:", error);
    }
  };

  const handleRadiusChange = async (newRadius) => {
    setLocalRadius(newRadius);
    try {
      await updateLocationSettings({ nearMeRadius: newRadius });
      // This will trigger a refetch of events in the components that use this data
      window.dispatchEvent(new CustomEvent('locationSettingsChanged'));
    } catch (error) {
      console.error("Failed to update radius:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 pt-20 max-w-5xl">
      <div className="space-y-8">
        {/* Theme Settings */}
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Theme</h2>
            <p className="text-sm text-base-content/70">Choose a theme for your chat interface</p>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {THEMES.map((t) => (
              <button
                key={t}
                className={`
                  group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors
                  ${theme === t ? "bg-base-200" : "hover:bg-base-200/50"}
                `}
                onClick={() => setTheme(t)}
              >
                <div className="relative h-8 w-full rounded-md overflow-hidden" data-theme={t}>
                  <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                    <div className="rounded bg-primary"></div>
                    <div className="rounded bg-secondary"></div>
                    <div className="rounded bg-accent"></div>
                    <div className="rounded bg-neutral"></div>
                  </div>
                </div>
                <span className="text-[11px] font-medium truncate w-full text-center">
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </span>
              </button>
            ))}
          </div>

          {/* Preview Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preview</h3>
            <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-lg">
              <div className="p-4 bg-base-200">
                <div className="max-w-lg mx-auto">
                  <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
                    {/* Chat Header */}
                    <div className="px-4 py-3 border-b border-base-300 bg-base-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium">
                          J
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">John Doe</h3>
                          <p className="text-xs text-base-content/70">Online</p>
                        </div>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-base-100">
                      {PREVIEW_MESSAGES.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`
                              max-w-[80%] rounded-xl p-3 shadow-sm
                              ${message.isSent ? "bg-primary text-primary-content" : "bg-base-200"}
                            `}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`
                                text-[10px] mt-1.5
                                ${message.isSent ? "text-primary-content/70" : "text-base-content/70"}
                              `}
                            >
                              12:00 PM
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 border-t border-base-300 bg-base-100">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="input input-bordered flex-1 text-sm h-10"
                          placeholder="Type a message..."
                          value="This is a preview"
                          readOnly
                        />
                        <button className="btn btn-primary h-10 min-h-0">
                          <Send size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location Settings */}
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Location Settings</h2>
            <p className="text-sm text-base-content/70">Configure how events and posts are shown based on location</p>
          </div>

          <div className="bg-base-100 rounded-xl p-6 space-y-6">
            {/* Current Location */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-medium">Current Location</h3>
                {currentLocation?.city && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setIsEditingLocation(true)}
                  >
                    <Edit className="w-4 h-4" />
                    Change
                  </button>
                )}
              </div>

              {currentLocation?.city ? (
                <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{currentLocation.city}, {currentLocation.state}</p>
                    <p className="text-sm text-base-content/60">Currently set location</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-warning/10 rounded-lg">
                  <MapPin className="w-5 h-5 text-warning" />
                  <div className="flex-1">
                    <p className="font-medium text-warning">No location set</p>
                    <p className="text-sm text-base-content/60">Location is required to discover events and posts</p>
                  </div>
                  <button 
                    className="btn btn-warning btn-sm" 
                    onClick={() => setIsEditingLocation(true)}
                  >
                    <Search className="w-4 h-4" />
                    Set Location
                  </button>
                </div>
              )}

              {/* Manual Location Setting */}
              {isEditingLocation && (
                <div className="p-4 bg-base-200 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Set Your Location</h4>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setIsEditingLocation(false);
                        setCitySearch("");
                        setSearchResults([]);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                      <h1 className="text-sm">City, State Code | ex: San Francisco, CA</h1>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      placeholder="Search for a city..."
                      value={citySearch}
                      onChange={(e) => handleCitySearch(e.target.value)}
                    />
                    
                    {searchResults.length > 0 && (
                      <div className="max-h-48 overflow-y-auto bg-base-100 rounded-lg border">
                        {searchResults.map((city, index) => (
                          <button
                            key={index}
                            className="w-full p-3 text-left hover:bg-base-200 flex items-center gap-3"
                            onClick={() => handleSelectCity(city)}
                          >
                            <MapPin className="w-4 h-4 text-primary" />
                            <div>
                              <p className="font-medium">{city.city}, {city.state}</p>
                              <p className="text-sm text-base-content/60">{city.country}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Search Radius */}
            <div className="space-y-3">
              <h4 className="font-medium">Search Radius</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>5 miles</span>
                  <span className="font-medium">{localRadius} miles</span>
                  <span>100 miles</span>
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
              </div>
              <p className="text-sm text-base-content/60">
                Events and posts within {localRadius} miles will be shown
              </p>
            </div>

            {isUpdating && (
              <div className="flex items-center gap-2 text-primary">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm">Updating location settings...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;