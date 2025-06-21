import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, X, Clock } from 'lucide-react';
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
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent-addresses');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  // Save to recent searches
  const saveToRecentSearches = (address: string) => {
    const updated = [address, ...recentSearches.filter(item => item !== address)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent-addresses', JSON.stringify(updated));
  };

  // Google Maps-style address search
  const searchAddresses = useCallback(async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    setShowSuggestions(true);

    try {
      const query = encodeURIComponent(searchTerm);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${query}&countrycodes=de&dedupe=1&extratags=1`
      );
      
      if (response.ok) {
        const data: AddressSuggestion[] = await response.json();
        
        // Format suggestions Google Maps style
        const formattedSuggestions = data
          .filter(suggestion => 
            suggestion.address && 
            suggestion.address.country_code === 'de' &&
            (suggestion.importance || 0) > 0.1
          )
          .map(suggestion => {
            const addr = suggestion.address!;
            
            // Primary line: Street + House Number
            const primaryParts = [];
            if (addr.road) primaryParts.push(addr.road);
            if (addr.house_number) primaryParts.push(addr.house_number);
            
            // Secondary line: Postal Code + City
            const secondaryParts = [];
            if (addr.postcode) secondaryParts.push(addr.postcode);
            if (addr.city || addr.town || addr.village) {
              secondaryParts.push(addr.city || addr.town || addr.village);
            }
            if (addr.state) secondaryParts.push(addr.state);
            
            const primaryAddress = primaryParts.join(' ');
            const secondaryAddress = secondaryParts.join(', ');
            
            return {
              ...suggestion,
              formatted_address: primaryAddress || suggestion.display_name.split(',')[0],
              short_name: secondaryAddress,
              display_name: suggestion.display_name
            };
          })
          .sort((a, b) => {
            // Prioritize exact matches and house numbers
            const aHasHouseNumber = a.address?.house_number ? 3 : 0;
            const bHasHouseNumber = b.address?.house_number ? 3 : 0;
            
            const aExactMatch = a.formatted_address?.toLowerCase().includes(searchTerm.toLowerCase()) ? 2 : 0;
            const bExactMatch = b.formatted_address?.toLowerCase().includes(searchTerm.toLowerCase()) ? 2 : 0;
            
            const aScore = aHasHouseNumber + aExactMatch + (a.importance || 0);
            const bScore = bHasHouseNumber + bExactMatch + (b.importance || 0);
            
            return bScore - aScore;
          })
          .slice(0, 5);
        
        setSuggestions(formattedSuggestions);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error('Address search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search (Google Maps style - 300ms delay)
  const debouncedSearch = useCallback((searchTerm: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      searchAddresses(searchTerm);
    }, 300);
  }, [searchAddresses]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (newValue.trim()) {
      debouncedSearch(newValue);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleInputFocus = () => {
    if (value.trim() && suggestions.length > 0) {
      setShowSuggestions(true);
    } else if (!value.trim() && recentSearches.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalItems = suggestions.length + (recentSearches.length > 0 && !value.trim() ? recentSearches.length : 0);
    
    if (!showSuggestions || totalItems === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < totalItems - 1 ? prev + 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : totalItems - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          const isRecentSearch = !value.trim() && selectedIndex < recentSearches.length;
          if (isRecentSearch) {
            const recentAddress = recentSearches[selectedIndex];
            onChange(recentAddress);
            setShowSuggestions(false);
            debouncedSearch(recentAddress);
          } else {
            const suggestionIndex = value.trim() ? selectedIndex : selectedIndex - recentSearches.length;
            if (suggestionIndex >= 0 && suggestionIndex < suggestions.length) {
              handleSuggestionClick(suggestions[suggestionIndex]);
            }
          }
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const detectMunicipality = (suggestion: AddressSuggestion) => {
    const cityName = suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || '';
    const municipality = partnerMunicipalities.find(m => 
      cityName.toLowerCase().includes(m.label.toLowerCase())
    );
    return municipality?.value || null;
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    const coordinates = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    };

    const displayAddress = suggestion.formatted_address || suggestion.display_name;
    onChange(displayAddress, coordinates);
    
    // Save to recent searches
    saveToRecentSearches(displayAddress);
    
    if (onLocationSelect) {
      onLocationSelect(coordinates);
    }

    const municipality = detectMunicipality(suggestion);
    onPartnerMunicipalityChange(municipality);
    
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  const handleRecentSearchClick = (recentAddress: string) => {
    onChange(recentAddress);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    // Trigger search for this address
    setTimeout(() => debouncedSearch(recentAddress), 100);
  };

  // ... keep existing code (getCurrentLocation function)
  const getCurrentLocation = () => {
    console.log('GPS button clicked');
    
    if (!navigator.geolocation) {
      alert('Geolocation wird von Ihrem Browser nicht unterstützt');
      return;
    }

    setIsGettingLocation(true);
    
    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('GPS position received:', position);
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`
          );
          
          if (response.ok) {
            const data = await response.json();
            console.log('Reverse geocoding result:', data);
            
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
            saveToRecentSearches(formattedAddress);
            
            if (onLocationSelect) {
              onLocationSelect(coordinates);
            }

            const municipality = detectMunicipality(data);
            onPartnerMunicipalityChange(municipality);
            
            console.log('GPS location set successfully:', formattedAddress);
          } else {
            throw new Error('Reverse geocoding failed');
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          const coordinatesAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          const coordinates = { lat: latitude, lng: longitude };
          
          onChange(coordinatesAddress, coordinates);
          
          if (onLocationSelect) {
            onLocationSelect(coordinates);
          }
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsGettingLocation(false);
        
        let errorMessage = 'Standort konnte nicht ermittelt werden. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Bitte erlauben Sie den Zugriff auf Ihren Standort.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Standortinformationen sind nicht verfügbar.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Die Standortabfrage hat zu lange gedauert.';
            break;
          default:
            errorMessage += 'Ein unbekannter Fehler ist aufgetreten.';
            break;
        }
        
        alert(errorMessage);
      },
      options
    );
  };

  const clearInput = () => {
    onChange('');
    onPartnerMunicipalityChange(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const showRecentSearches = !value.trim() && recentSearches.length > 0;
  const totalItems = suggestions.length + (showRecentSearches ? recentSearches.length : 0);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        📍 Standort eingeben
      </label>
      
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Adresse eingeben... (z.B. Lange Gasse 20, Nürnberg)"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          className="pr-20"
          autoComplete="off"
        />
        
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

      {/* GPS Loading indicator */}
      {isGettingLocation && (
        <div className="absolute top-full left-0 right-0 bg-blue-50 border border-blue-200 rounded-md shadow-lg mt-1 p-3 z-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm text-blue-600">Standort wird ermittelt...</span>
          </div>
        </div>
      )}

      {/* Google Maps style suggestions dropdown */}
      {showSuggestions && (showRecentSearches || suggestions.length > 0) && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-80 overflow-y-auto z-50"
        >
          {/* Recent searches */}
          {showRecentSearches && (
            <>
              <div className="px-4 py-2 bg-gray-50 border-b text-xs font-medium text-gray-500 uppercase tracking-wide">
                Letzte Suchen
              </div>
              {recentSearches.map((recentAddress, index) => (
                <button
                  key={`recent-${index}`}
                  type="button"
                  onClick={() => handleRecentSearchClick(recentAddress)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {recentAddress}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Address suggestions */}
          {suggestions.length > 0 && (
            <>
              {showRecentSearches && (
                <div className="px-4 py-2 bg-gray-50 border-b text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Vorschläge
                </div>
              )}
              {suggestions.map((suggestion, index) => {
                const adjustedIndex = showRecentSearches ? index + recentSearches.length : index;
                return (
                  <button
                    key={`suggestion-${index}`}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors ${
                      adjustedIndex === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {suggestion.formatted_address}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {suggestion.short_name}
                        </div>
                        {suggestion.address?.house_number && (
                          <div className="text-xs text-green-600 mt-1 flex items-center">
                            <span className="w-1 h-1 bg-green-500 rounded-full mr-1"></span>
                            Hausnummer verfügbar
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressInput;
