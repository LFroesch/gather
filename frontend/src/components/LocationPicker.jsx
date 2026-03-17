import { useState, useCallback, useRef, useEffect } from 'react';
import { MapPin, Home, X, Loader, Search } from 'lucide-react';
import { useLocationStore } from '../store/useLocationStore';

const LocationPicker = ({ onLocationSelect, initialLocation, showPlaceName = false, placeholderPlace = "Place name (optional)" }) => {
  const { currentLocation, searchCities } = useLocationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCity, setSelectedCity] = useState(initialLocation || null);
  const [placeName, setPlaceName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const timeoutRef = useRef(null);
  const abortRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Notify parent on changes
  useEffect(() => {
    if (selectedCity) {
      onLocationSelect({
        city: selectedCity.city,
        state: selectedCity.state,
        country: selectedCity.country,
        coordinates: selectedCity.coordinates,
        placeName: placeName.trim() || undefined
      });
    } else {
      onLocationSelect(null);
    }
  }, [selectedCity, placeName]);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);
    abortRef.current = new AbortController();

    timeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchCities(query, abortRef.current);
        if (!abortRef.current?.signal.aborted) {
          setSearchResults(results);
        }
      } catch {
        // aborted or failed
      } finally {
        setIsSearching(false);
      }
    }, 500);
  }, [searchCities]);

  const selectCity = (city) => {
    setSelectedCity(city);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const useHomeCity = () => {
    if (!currentLocation?.city) return;
    selectCity(currentLocation);
  };

  const clearCity = () => {
    setSelectedCity(null);
    setPlaceName('');
  };

  return (
    <div className="space-y-3">
      {/* Selected city display */}
      {selectedCity ? (
        <div className="flex items-center gap-2 bg-base-200 rounded-lg px-3 py-2">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <span className="flex-1 text-sm font-medium">
            {selectedCity.city}, {selectedCity.state}
          </span>
          <button type="button" onClick={clearCity} className="btn btn-ghost btn-xs btn-circle">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        /* City search */
        <div className="relative" ref={dropdownRef}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                className="input input-bordered w-full pl-9"
                placeholder="Search for a city..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              {isSearching && (
                <Loader className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-primary" />
              )}
            </div>
            <button
              type="button"
              onClick={useHomeCity}
              className="btn btn-outline btn-square tooltip tooltip-left"
              data-tip="Use home city"
              disabled={!currentLocation?.city}
            >
              <span className="text-lg">🏠</span>
            </button>
          </div>

          {/* Search results dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-base-100 rounded-lg border border-base-300 shadow-lg max-h-48 overflow-y-auto">
              {searchResults.map((city, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-base-200 flex items-center gap-2 border-b border-base-300 last:border-0 transition-colors"
                  onClick={() => selectCity(city)}
                >
                  <MapPin className="w-3 h-3 text-base-content/40 shrink-0" />
                  <span>{city.city}, {city.state}</span>
                </button>
              ))}
            </div>
          )}

          {showDropdown && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
            <div className="absolute z-50 w-full mt-1 p-3 text-center text-sm text-base-content/60 bg-base-100 rounded-lg border border-base-300">
              No cities found
            </div>
          )}
        </div>
      )}

      {/* Place name input */}
      {showPlaceName && selectedCity && (
        <input
          type="text"
          className="input input-bordered w-full"
          placeholder={placeholderPlace}
          value={placeName}
          onChange={(e) => setPlaceName(e.target.value)}
          maxLength={100}
        />
      )}
    </div>
  );
};

export default LocationPicker;
