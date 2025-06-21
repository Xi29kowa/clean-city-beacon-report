
import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from 'lucide-react';
import { AddressSuggestion } from '@/types/location';
import { reverseGeocode, checkPartnerMunicipality } from '@/utils/locationUtils';

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
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  const fetchAddressSuggestions = async (query: string): Promise<AddressSuggestion[]> => {
    if (query.length < 3) return [];

    try {
      // Focused search for German addresses with multiple strategies
      const searchStrategies = [
        // Strategy 1: Exact search with city context
        {
          q: `${query}, Deutschland`,
          bounded: '1',
          viewbox: '5.8,47.2,15.0,55.0', // Germany bounds
          countrycodes: 'DE'
        },
        // Strategy 2: Broader search
        {
          q: query,
          countrycodes: 'DE',
          bounded: '0'
        }
      ];

      let allResults: any[] = [];

      for (const strategy of searchStrategies) {
        const searchParams = new URLSearchParams({
          format: 'json',
          addressdetails: '1',
          limit: '10',
          extratags: '1',
          namedetails: '1',
          'accept-language': 'de',
          ...strategy
        });

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?${searchParams}`,
            {
              headers: {
                'User-Agent': 'CleanCity/1.0 (https://cleancity.app)'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
              allResults = [...allResults, ...data];
            }
          }
        } catch (error) {
          console.warn('Search strategy failed:', error);
        }
      }

      // Filter and process results
      const filteredResults = allResults
        .filter((item: any) => {
          // Filter for real addresses in Germany
          const hasValidAddress = item.address && (
            item.address.house_number || 
            item.address.road || 
            item.address.pedestrian ||
            item.address.residential ||
            ['house', 'building', 'address'].includes(item.type)
          );
          
          const isGermany = item.address?.country_code === 'de';
          
          const isRelevantType = [
            'house', 'building', 'address', 'residential',
            'commercial', 'retail', 'office', 'place'
          ].includes(item.type) || 
          ['place', 'highway', 'amenity', 'shop'].includes(item.class);

          return hasValidAddress && isGermany && isRelevantType;
        })
        .map((item: any) => {
          // Build comprehensive address with postal code
          let displayName = '';
          let shortName = '';
          
          if (item.address) {
            const parts = [];
            const shortParts = [];
            
            // Street and house number
            if (item.address.house_number && item.address.road) {
              const streetAddress = `${item.address.road} ${item.address.house_number}`;
              parts.push(streetAddress);
              shortParts.push(streetAddress);
            } else if (item.address.road) {
              parts.push(item.address.road);
              shortParts.push(item.address.road);
            }
            
            // Postal code - always include if available
            if (item.address.postcode) {
              parts.push(item.address.postcode);
              shortParts.push(item.address.postcode);
            }
            
            // City/town
            const city = item.address.city || item.address.town || item.address.village;
            if (city) {
              parts.push(city);
              shortParts.push(city);
            }
            
            // State for clarity (only in full display name)
            if (item.address.state && item.address.state !== city) {
              parts.push(item.address.state);
            }
            
            displayName = parts.join(', ');
            shortName = shortParts.join(', ');
          }

          return {
            display_name: displayName || item.display_name,
            short_name: shortName,
            lat: item.lat,
            lon: item.lon,
            address: item.address,
            importance: item.importance || 0
          };
        })
        // Remove duplicates
        .filter((item: any, index: number, self: any[]) => {
          return index === self.findIndex(t => 
            Math.abs(parseFloat(t.lat) - parseFloat(item.lat)) < 0.0001 &&
            Math.abs(parseFloat(t.lon) - parseFloat(item.lon)) < 0.0001
          );
        })
        // Sort by relevance
        .sort((a: any, b: any) => {
          // Prioritize results with house numbers and postal codes
          const aHasHouseNumber = a.address?.house_number ? 1 : 0;
          const bHasHouseNumber = b.address?.house_number ? 1 : 0;
          const aHasPostcode = a.address?.postcode ? 1 : 0;
          const bHasPostcode = b.address?.postcode ? 1 : 0;
          
          const aScore = aHasHouseNumber + aHasPostcode + (a.importance || 0);
          const bScore = bHasHouseNumber + bHasPostcode + (b.importance || 0);
          
          return bScore - aScore;
        })
        .slice(0, 8);

      return filteredResults;
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      return [];
    }
  };

  const handleAddressInput = (inputValue: string) => {
    onChange(inputValue);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(async () => {
      if (inputValue.length >= 3) {
        setIsSearching(true);
        const suggestions = await fetchAddressSuggestions(inputValue);
        setAddressSuggestions(suggestions);
        setShowSuggestions(true);
        setIsSearching(false);
      } else {
        setAddressSuggestions([]);
        setShowSuggestions(false);
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSuggestionSelect = async (suggestion: AddressSuggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    
    // Use the complete address with postal code
    const addressToShow = suggestion.short_name || suggestion.display_name;
    
    onChange(addressToShow, { lat, lng });
    setShowSuggestions(false);
    setAddressSuggestions([]);
    
    // Immediately navigate map to selected location
    if (onLocationSelect) {
      onLocationSelect({ lat, lng });
    }
    
    const municipality = checkPartnerMunicipality(lat, lng);
    onPartnerMunicipalityChange(municipality);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation wird von diesem Browser nicht unterstützt.');
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await reverseGeocode(latitude, longitude);
        
        onChange(address, { lat: latitude, lng: longitude });
        
        // Navigate map to current location
        if (onLocationSelect) {
          onLocationSelect({ lat: latitude, lng: longitude });
        }
        
        const municipality = checkPartnerMunicipality(latitude, longitude);
        onPartnerMunicipalityChange(municipality);
        
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsGettingLocation(false);
        
        const errorMessages = {
          [error.PERMISSION_DENIED]: 'Standortzugriff wurde verweigert.',
          [error.POSITION_UNAVAILABLE]: 'Standortinformationen sind nicht verfügbar.',
          [error.TIMEOUT]: 'Timeout beim Abrufen des Standorts.',
        };
        
        alert(errorMessages[error.code] || 'Ein unbekannter Fehler ist aufgetreten.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        📍 Standort *
      </label>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => handleAddressInput(e.target.value)}
            placeholder="Straße, Hausnummer, PLZ eingeben..."
            className="w-full"
            required
          />
          
          {showSuggestions && (
            <div 
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto z-50 mt-1"
            >
              {isSearching ? (
                <div className="p-3 text-gray-500 text-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mx-auto mb-2"></div>
                  Adresse wird gesucht...
                </div>
              ) : addressSuggestions.length > 0 ? (
                addressSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-blue-50 focus:outline-none"
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 font-medium">
                          {suggestion.short_name || suggestion.display_name}
                        </div>
                        {suggestion.short_name && suggestion.short_name !== suggestion.display_name && (
                          <div className="text-xs text-gray-500 truncate mt-1">
                            {suggestion.display_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : value.length >= 3 ? (
                <div className="p-3 text-gray-500 text-center text-sm">
                  Keine passenden Adressen gefunden
                </div>
              ) : null}
            </div>
          )}
        </div>
        
        <Button
          type="button"
          variant="outline"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="flex items-center gap-2 px-3"
        >
          {isGettingLocation ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          {isGettingLocation ? 'Suche...' : 'GPS'}
        </Button>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Geben Sie Straße, Hausnummer oder PLZ ein für präzise Adressvorschläge
      </p>
    </div>
  );
};

export default AddressInput;
