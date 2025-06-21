
import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from 'lucide-react';
import { AddressSuggestion } from '@/types/location';
import { fetchAddressSuggestions, reverseGeocode, checkPartnerMunicipality } from '@/utils/locationUtils';

interface AddressInputProps {
  value: string;
  onChange: (location: string, coordinates?: { lat: number; lng: number }) => void;
  onPartnerMunicipalityChange: (municipality: string | null) => void;
}

const AddressInput: React.FC<AddressInputProps> = ({
  value,
  onChange,
  onPartnerMunicipalityChange
}) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const handleAddressInput = (inputValue: string) => {
    onChange(inputValue);
    
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      const suggestions = await fetchAddressSuggestions(inputValue);
      setAddressSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0 || inputValue.length >= 3);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleSuggestionSelect = async (suggestion: AddressSuggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    
    onChange(suggestion.display_name, { lat, lng });
    setShowSuggestions(false);
    setAddressSuggestions([]);
    
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
            placeholder="Geben Sie eine Adresse ein..."
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
                  Suche läuft...
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
                      <span className="text-sm text-gray-700 line-clamp-2">
                        {suggestion.display_name}
                      </span>
                    </div>
                  </button>
                ))
              ) : value.length >= 3 ? (
                <div className="p-3 text-gray-500 text-center text-sm">
                  Keine Adressen gefunden
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
        Geben Sie eine genaue Adresse ein oder nutzen Sie GPS für Ihren aktuellen Standort
      </p>
    </div>
  );
};

export default AddressInput;
