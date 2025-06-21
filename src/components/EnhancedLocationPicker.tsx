
import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, X } from 'lucide-react';

interface EnhancedLocationPickerProps {
  value: string;
  onChange: (location: string, coordinates?: { lat: number; lng: number }) => void;
  onPartnerMunicipalityChange: (municipality: string | null) => void;
  onWasteBinSelect?: (binId: string, location: string) => void;
}

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface WasteBin {
  id: string;
  location: string;
  lat: number;
  lng: number;
  fillLevel: string;
}

// Partner municipalities with their approximate boundaries
const partnerMunicipalities = [
  { 
    value: 'nuernberg', 
    label: 'Nürnberg',
    bounds: {
      north: 49.5172,
      south: 49.3697,
      east: 11.1658,
      west: 10.9648
    }
  },
  { 
    value: 'erlangen', 
    label: 'Erlangen',
    bounds: {
      north: 49.6406,
      south: 49.5594,
      east: 11.0789,
      west: 10.9789
    }
  },
  { 
    value: 'fuerth', 
    label: 'Fürth',
    bounds: {
      north: 49.5089,
      south: 49.4533,
      east: 11.0233,
      west: 10.9533
    }
  }
];

// Mock waste bin data for demonstration
const wasteBins: WasteBin[] = [
  { id: 'bin_1', location: 'Lange Gasse 20', lat: 49.4521, lng: 11.0767, fillLevel: 'high' },
  { id: 'bin_2', location: 'Hauptmarkt 18', lat: 49.4545, lng: 11.0778, fillLevel: 'medium' },
  { id: 'bin_3', location: 'Königstraße 5', lat: 49.4533, lng: 11.0785, fillLevel: 'low' },
  { id: 'bin_4', location: 'Lorenzkirche', lat: 49.4492, lng: 11.0788, fillLevel: 'high' },
  { id: 'bin_5', location: 'Albrecht-Dürer-Platz', lat: 49.4567, lng: 11.0801, fillLevel: 'medium' }
];

const EnhancedLocationPicker: React.FC<EnhancedLocationPickerProps> = ({
  value,
  onChange,
  onPartnerMunicipalityChange,
  onWasteBinSelect
}) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedWasteBin, setSelectedWasteBin] = useState<WasteBin | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapIframeRef = useRef<HTMLIFrameElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Check if coordinates are in partner municipality
  const checkPartnerMunicipality = (lat: number, lng: number) => {
    for (const municipality of partnerMunicipalities) {
      const { bounds } = municipality;
      if (
        lat >= bounds.south &&
        lat <= bounds.north &&
        lng >= bounds.west &&
        lng <= bounds.east
      ) {
        return municipality.value;
      }
    }
    return null;
  };

  // Fetch address suggestions from Nominatim
  const fetchAddressSuggestions = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      // Focus on German addresses with better parameters
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&countrycodes=de&addressdetails=1&bounded=1&viewbox=10.9,49.6,11.2,49.3`
      );
      const data = await response.json();
      
      if (data && Array.isArray(data)) {
        setAddressSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setAddressSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle address input changes
  const handleAddressInput = (inputValue: string) => {
    onChange(inputValue);
    
    // Debounce the API calls
    const timeoutId = setTimeout(() => {
      fetchAddressSuggestions(inputValue);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = async (suggestion: AddressSuggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    
    onChange(suggestion.display_name, { lat, lng });
    setShowSuggestions(false);
    setAddressSuggestions([]);
    
    // Check municipality
    const municipality = checkPartnerMunicipality(lat, lng);
    onPartnerMunicipalityChange(municipality);
  };

  // Handle waste bin selection from map
  useEffect(() => {
    const handleMapMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://routenplanung.vercel.app') return;
      
      if (event.data.type === 'wasteBinClick') {
        const { binId } = event.data;
        const selectedBin = wasteBins.find(bin => bin.id === binId);
        
        if (selectedBin) {
          setSelectedWasteBin(selectedBin);
          if (onWasteBinSelect) {
            onWasteBinSelect(selectedBin.id, selectedBin.location);
          }
        }
      }
    };

    window.addEventListener('message', handleMapMessage);
    return () => window.removeEventListener('message', handleMapMessage);
  }, [onWasteBinSelect]);

  // Close suggestions when clicking outside
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

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation wird von diesem Browser nicht unterstützt.');
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          
          let address = '';
          if (data.display_name) {
            const parts = data.display_name.split(',');
            address = parts.slice(0, 3).join(', ').trim();
          } else {
            address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          }
          
          onChange(address, { lat: latitude, lng: longitude });
          
          const municipality = checkPartnerMunicipality(latitude, longitude);
          onPartnerMunicipalityChange(municipality);
          
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          onChange(address, { lat: latitude, lng: longitude });
          
          const municipality = checkPartnerMunicipality(latitude, longitude);
          onPartnerMunicipalityChange(municipality);
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsGettingLocation(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('Standortzugriff wurde verweigert.');
            break;
          case error.POSITION_UNAVAILABLE:
            alert('Standortinformationen sind nicht verfügbar.');
            break;
          case error.TIMEOUT:
            alert('Timeout beim Abrufen des Standorts.');
            break;
          default:
            alert('Ein unbekannter Fehler ist aufgetreten.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Handle waste bin deselection
  const handleDeselectWasteBin = () => {
    setSelectedWasteBin(null);
    if (onWasteBinSelect) {
      onWasteBinSelect('', '');
    }
  };

  return (
    <div className="space-y-4">
      {/* Address Input with Autocomplete */}
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
            
            {/* Address Suggestions Dropdown */}
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

      {/* Selected Waste Bin Display */}
      {selectedWasteBin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-1">
                🗑️ Ausgewählter Mülleimer
              </label>
              <div className="space-y-1">
                <p className="text-sm text-blue-700 font-medium">{selectedWasteBin.location}</p>
                <p className="text-xs text-blue-600">
                  ID: {selectedWasteBin.id} • Füllstand: {
                    selectedWasteBin.fillLevel === 'high' ? '🔴 Hoch' :
                    selectedWasteBin.fillLevel === 'medium' ? '🟡 Mittel' : '🟢 Niedrig'
                  }
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDeselectWasteBin}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Enhanced Interactive Map Display */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🗺️ Interaktive Karte mit Mülleimern
        </label>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <iframe 
            ref={mapIframeRef}
            src="https://routenplanung.vercel.app/nbg_wastebaskets_map.html"
            className="w-full h-96 border-0 rounded-t-lg"
            title="Interaktive Mülleimer Karte"
            style={{ minHeight: '384px' }}
          />
          <div className="p-3 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-600 flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              Klicken Sie auf einen Mülleimer-Marker um ihn auszuwählen. Sie können auch einen Standort ohne spezifischen Mülleimer melden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLocationPicker;
