
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, X } from 'lucide-react';
import { AddressSuggestion } from '@/types/location';
import { municipalities } from '@/data/municipalities';

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

  // Optimized debounced search with better performance
  const debouncedSearch = useCallback((searchTerm: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      if (searchTerm.length > 2) {
        setIsLoading(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&q=${encodeURIComponent(searchTerm)}, Germany`
          );
          
          if (response.ok) {
            const data: AddressSuggestion[] = await response.json();
            
            // Improved filtering and formatting
            const filteredSuggestions = data
              .filter(suggestion => 
                suggestion.address && 
                suggestion.address.country_code === 'de'
              )
              .map(suggestion => {
                const addr = suggestion.address!;
                const parts = [];
                
                if (addr.road) parts.push(addr.road);
                if (addr.house_number) parts.push(addr.house_number);
                if (addr.postcode) parts.push(addr.postcode);
                if (addr.city || addr.town || addr.village) {
                  parts.push(addr.city || addr.town || addr.village);
                }
                
                return {
                  ...suggestion,
                  display_name: parts.join(', '),
                  short_name: parts.slice(0, 2).join(' ')
                };
              })
              .slice(0, 6); // Limit to 6 suggestions for better performance
            
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
    }, 300); // Reduced debounce time for better responsiveness
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    debouncedSearch(newValue);
  };

  const detectMunicipality = (suggestion: AddressSuggestion) => {
    const cityName = suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || '';
    const municipality = municipalities.find(m => 
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
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
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
            
            const formattedAddress = parts.join(', ');
            const coordinates = { lat: latitude, lng: longitude };
            
            onChange(formattedAddress, coordinates);
            
            if (onLocationSelect) {
              onLocationSelect(coordinates);
            }

            const municipality = detectMunicipality(data);
            onPartnerMunicipalityChange(municipality);
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Standort konnte nicht ermittelt werden');
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
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
          placeholder="Straße, Hausnummer, PLZ, Stadt eingeben..."
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
            <Navigation className={`w-4 h-4 ${isGettingLocation ? 'animate-pulse' : ''}`} />
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1 p-3 z-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm text-gray-600">Suche...</span>
          </div>
        </div>
      )}

      {showSuggestions && addressSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-64 overflow-y-auto z-50">
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
                    {suggestion.short_name}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {suggestion.display_name}
                  </div>
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
