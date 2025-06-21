import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, X } from 'lucide-react';
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
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Enhanced address search with better house number handling
  const debouncedSearch = useCallback((searchTerm: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      if (searchTerm.length > 2) {
        setIsLoading(true);
        try {
          // Enhanced search query for better accuracy
          const searchQuery = encodeURIComponent(searchTerm);
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=10&q=${searchQuery}&countrycodes=de&dedupe=1&extratags=1`
          );
          
          if (response.ok) {
            const data: AddressSuggestion[] = await response.json();
            
            // Enhanced filtering and formatting for better address display
            const filteredSuggestions = data
              .filter(suggestion => 
                suggestion.address && 
                suggestion.address.country_code === 'de' &&
                suggestion.importance > 0.3 // Filter for more relevant results
              )
              .map(suggestion => {
                const addr = suggestion.address!;
                const parts = [];
                const shortParts = [];
                
                // Build detailed address
                if (addr.road) {
                  parts.push(addr.road);
                  shortParts.push(addr.road);
                }
                if (addr.house_number) {
                  parts.push(addr.house_number);
                  shortParts.push(addr.house_number);
                }
                if (addr.postcode) parts.push(addr.postcode);
                if (addr.city || addr.town || addr.village) {
                  const city = addr.city || addr.town || addr.village;
                  parts.push(city);
                  if (shortParts.length < 2) shortParts.push(city);
                }
                if (addr.state) parts.push(addr.state);
                
                return {
                  ...suggestion,
                  display_name: parts.join(', '),
                  short_name: shortParts.join(' '),
                  formatted_address: `${addr.road || ''} ${addr.house_number || ''}`.trim() || parts.slice(0, 2).join(' ')
                };
              })
              .sort((a, b) => {
                // Prioritize results with house numbers
                const aHasHouseNumber = a.address?.house_number ? 1 : 0;
                const bHasHouseNumber = b.address?.house_number ? 1 : 0;
                if (aHasHouseNumber !== bHasHouseNumber) {
                  return bHasHouseNumber - aHasHouseNumber;
                }
                // Then sort by importance
                return (b.importance || 0) - (a.importance || 0);
              })
              .slice(0, 8); // Limit to 8 suggestions
            
            setAddressSuggestions(filteredSuggestions);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setAddressSuggestions([]);
        setShowSuggestions(false);
        setIsLoading(false);
      }
    }, 200); // Faster response time
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    debouncedSearch(newValue);
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

    onChange(suggestion.display_name, coordinates);
    
    // Immediately trigger map navigation
    if (onLocationSelect) {
      onLocationSelect(coordinates);
    }

    const municipality = detectMunicipality(suggestion);
    onPartnerMunicipalityChange(municipality);
    
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const getCurrentLocation = () => {
    console.log('GPS button clicked');
    
    if (!navigator.geolocation) {
      alert('Geolocation wird von Ihrem Browser nicht unterstützt');
      return;
    }

    setIsGettingLocation(true);
    
    // Enhanced geolocation options
    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // Increased timeout
      maximumAge: 60000 // Allow cached location up to 1 minute
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
          // Fallback to coordinates
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
    setAddressSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Cleanup timeout on unmount
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
          placeholder="Straße, Hausnummer, PLZ, Stadt eingeben... (z.B. Lange Gasse 20, Nürnberg)"
          value={value}
          onChange={handleInputChange}
          className="pr-20"
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

      {isGettingLocation && (
        <div className="absolute top-full left-0 right-0 bg-blue-50 border border-blue-200 rounded-md shadow-lg mt-1 p-3 z-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm text-blue-600">Standort wird ermittelt...</span>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1 p-3 z-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm text-gray-600">Suche nach Adressen...</span>
          </div>
        </div>
      )}

      {showSuggestions && addressSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-80 overflow-y-auto z-50">
          {addressSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {suggestion.formatted_address || suggestion.short_name}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {suggestion.display_name}
                  </div>
                  {suggestion.address?.house_number && (
                    <div className="text-xs text-green-600 mt-1">
                      ✓ Hausnummer verfügbar
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressInput;
