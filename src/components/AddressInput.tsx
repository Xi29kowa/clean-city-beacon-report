import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, X, Search } from 'lucide-react';
import { AddressSuggestion } from '@/types/location';
import { partnerMunicipalities } from '@/data/municipalities';

interface AddressInputProps {
  value: string;
  onChange: (location: string, coordinates?: { lat: number; lng: number }) => void;
  onPartnerMunicipalityChange: (municipality: string | null) => void;
  onLocationSelect?: (coordinates: { lat: number; lng: number }) => void;
}

const AddressInput: React.FC<AddressInputProps> = ({
  value,
  onChange,
  onPartnerMunicipalityChange,
  onLocationSelect
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const debouncedSearch = useCallback((query: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimeoutRef.current = setTimeout(() => {
      searchAddresses(query);
    }, 300);
  }, []);

  // Enhanced address search function
  const searchAddresses = async (query: string) => {
    console.log('Searching for:', query);
    setIsLoading(true);
    setShowSuggestions(true);

    try {
      // Build a better search query
      const searchQuery = `${query}, Deutschland`;
      const encodedQuery = encodeURIComponent(searchQuery);
      
      const url = `https://nominatim.openstreetmap.org/search?` +
        `format=json` +
        `&q=${encodedQuery}` +
        `&countrycodes=de` +
        `&addressdetails=1` +
        `&limit=10` +
        `&dedupe=1` +
        `&extratags=1`;

      console.log('API URL:', url);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'WasteBin-App/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw API response:', data);

      if (!Array.isArray(data)) {
        console.error('API response is not an array:', data);
        setSuggestions([]);
        return;
      }

      // Filter and format suggestions
      const filteredSuggestions = data
        .filter(item => {
          // Only keep relevant address types
          const validTypes = ['house', 'building', 'residential', 'commercial', 'industrial'];
          const validClasses = ['place', 'highway', 'building', 'amenity', 'landuse'];
          
          return item.address && 
                 item.address.country_code === 'de' &&
                 (validTypes.includes(item.type) || validClasses.includes(item.class)) &&
                 item.importance > 0.1;
        })
        .map(item => {
          const addr = item.address;
          
          // Build formatted address
          let streetName = addr.road || addr.pedestrian || addr.footway || '';
          let houseNumber = addr.house_number || '';
          let postcode = addr.postcode || '';
          let city = addr.city || addr.town || addr.village || addr.municipality || '';
          let state = addr.state || '';

          // Primary line: Street + House Number
          let primaryLine = '';
          if (streetName && houseNumber) {
            primaryLine = `${streetName} ${houseNumber}`;
          } else if (streetName) {
            primaryLine = streetName;
          } else {
            // Fallback to display name first part
            primaryLine = item.display_name.split(',')[0].trim();
          }

          // Secondary line: Postcode + City
          let secondaryLine = '';
          if (postcode && city) {
            secondaryLine = `${postcode} ${city}`;
          } else if (city) {
            secondaryLine = city;
          }

          return {
            ...item,
            primaryLine,
            secondaryLine,
            fullAddress: `${primaryLine}${secondaryLine ? ', ' + secondaryLine : ''}`
          };
        })
        .sort((a, b) => {
          // Sort by relevance to search query
          const queryLower = query.toLowerCase();
          
          // Exact match gets highest priority
          const aExact = a.primaryLine.toLowerCase().includes(queryLower) ? 10 : 0;
          const bExact = b.primaryLine.toLowerCase().includes(queryLower) ? 10 : 0;
          
          // House number presence gets priority
          const aHouse = a.address.house_number ? 5 : 0;
          const bHouse = b.address.house_number ? 5 : 0;
          
          // Starts with query gets priority
          const aStarts = a.primaryLine.toLowerCase().startsWith(queryLower) ? 3 : 0;
          const bStarts = b.primaryLine.toLowerCase().startsWith(queryLower) ? 3 : 0;
          
          const aScore = aExact + aHouse + aStarts + (a.importance || 0);
          const bScore = bExact + bHouse + bStarts + (b.importance || 0);
          
          return bScore - aScore;
        })
        .slice(0, 8); // Limit to 8 results

      console.log('Formatted suggestions:', filteredSuggestions);
      setSuggestions(filteredSuggestions);

    } catch (error) {
      console.error('Address search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('Input changed:', newValue);
    onChange(newValue);
    debouncedSearch(newValue);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: any) => {
    console.log('Suggestion clicked:', suggestion);
    
    const coordinates = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    };

    onChange(suggestion.fullAddress, coordinates);
    
    if (onLocationSelect) {
      onLocationSelect(coordinates);
    }

    // Check for partner municipality
    const cityName = suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || '';
    const municipality = partnerMunicipalities.find(m => 
      cityName.toLowerCase().includes(m.label.toLowerCase())
    );
    onPartnerMunicipalityChange(municipality?.value || null);
    
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (value.trim() && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation wird von Ihrem Browser nicht unterstützt');
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`
          );
          
          if (response.ok) {
            const data = await response.json();
            const addr = data.address || {};
            
            const parts = [];
            if (addr.road) parts.push(addr.road);
            if (addr.house_number) parts.push(addr.house_number);
            if (addr.postcode) parts.push(addr.postcode);
            if (addr.city || addr.town || addr.village) {
              parts.push(addr.city || addr.town || addr.village);
            }
            
            const formattedAddress = parts.join(', ') || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            const coordinates = { lat: latitude, lng: longitude };
            
            onChange(formattedAddress, coordinates);
            
            if (onLocationSelect) {
              onLocationSelect(coordinates);
            }

            const cityName = addr.city || addr.town || addr.village || '';
            const municipality = partnerMunicipalities.find(m => 
              cityName.toLowerCase().includes(m.label.toLowerCase())
            );
            onPartnerMunicipalityChange(municipality?.value || null);
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsGettingLocation(false);
        alert('Standort konnte nicht ermittelt werden.');
      }
    );
  };

  // Clear input
  const clearInput = () => {
    onChange('');
    onPartnerMunicipalityChange(null);
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        📍 Standort eingeben
      </label>
      
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Adresse eingeben... (z.B. Parkweg 7 Oberasbach)"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className="pr-20 pl-10"
          autoComplete="off"
        />
        
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearInput}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="h-8 w-8 p-0 hover:bg-blue-100"
            title="Aktuellen Standort verwenden"
          >
            <Navigation className={`w-4 h-4 ${isGettingLocation ? 'animate-pulse text-blue-600' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1 p-3 z-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm text-gray-600">Suche nach Adressen...</span>
          </div>
        </div>
      )}

      {/* GPS Loading */}
      {isGettingLocation && (
        <div className="absolute top-full left-0 right-0 bg-blue-50 border border-blue-200 rounded-md shadow-lg mt-1 p-3 z-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm text-blue-600">Standort wird ermittelt...</span>
          </div>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-80 overflow-y-auto z-50"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`suggestion-${index}`}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {suggestion.primaryLine}
                  </div>
                  {suggestion.secondaryLine && (
                    <div className="text-sm text-gray-500 truncate">
                      {suggestion.secondaryLine}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {showSuggestions && value.trim() && suggestions.length === 0 && !isLoading && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1 p-4 z-50">
          <div className="text-center text-gray-500 text-sm">
            Keine Adressen gefunden für "{value}"
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressInput;
