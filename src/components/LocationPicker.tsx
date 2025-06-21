import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2, Eye, EyeOff, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import L from 'leaflet';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LocationPickerProps {
  value: string;
  onChange: (location: string, coordinates?: { lat: number; lng: number }) => void;
  onPartnerMunicipalityChange?: (municipality: string | null) => void;
}

interface AddressSuggestion {
  display_name: string;
  formatted_address: string;
  lat: number;
  lng: number;
  place_id?: string;
  relevance?: number;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ value, onChange, onPartnerMunicipalityChange }) => {
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const searchCacheRef = useRef<Map<string, AddressSuggestion[]>>(new Map());
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Partner municipalities mapping
  const partnerMunicipalities = {
    'nürnberg': 'nuernberg',
    'nuremberg': 'nuernberg', 
    'erlangen': 'erlangen',
    'fürth': 'fuerth',
    'fuerth': 'fuerth'
  };

  // Nürnberg metropolitan area bounds for focused search
  const NUREMBERG_BOUNDS = {
    north: 49.5,
    south: 49.3,
    east: 11.2,
    west: 10.9
  };

  // Initialize Leaflet CSS
  useEffect(() => {
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  // Create map when coordinates are available and map should be shown
  useEffect(() => {
    if (coordinates && mapRef.current && !mapInstanceRef.current && showMap) {
      const map = L.map(mapRef.current).setView([coordinates.lat, coordinates.lng], 16);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      const marker = L.marker([coordinates.lat, coordinates.lng], { draggable: true }).addTo(map);

      marker.on('dragend', async () => {
        const position = marker.getLatLng();
        const newCoords = { lat: position.lat, lng: position.lng };
        setCoordinates(newCoords);
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&addressdetails=1&zoom=18&accept-language=de`
          );
          const data = await response.json();
          if (data.display_name) {
            const formattedAddress = formatAddress(data);
            onChange(formattedAddress, newCoords);
            checkPartnerMunicipality(formattedAddress);
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          onChange(`${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`, newCoords);
        }
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }
  }, [coordinates, onChange, showMap]);

  // Update marker position when coordinates change
  useEffect(() => {
    if (coordinates && mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([coordinates.lat, coordinates.lng]);
      mapInstanceRef.current.setView([coordinates.lat, coordinates.lng], 16);
    }
  }, [coordinates]);

  // Clean up map when hiding
  useEffect(() => {
    if (!showMap && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }
  }, [showMap]);

  // Format address for better display
  const formatAddress = (nominatimResult: any): string => {
    const address = nominatimResult.address || {};
    const parts = [];
    
    // Add house number and street
    if (address.house_number && address.road) {
      parts.push(`${address.road} ${address.house_number}`);
    } else if (address.road) {
      parts.push(address.road);
    }
    
    // Add postal code and city
    if (address.postcode && address.city) {
      parts.push(`${address.postcode} ${address.city}`);
    } else if (address.city || address.town || address.village) {
      const place = address.city || address.town || address.village;
      parts.push(address.postcode ? `${address.postcode} ${place}` : place);
    }
    
    return parts.length > 0 ? parts.join(', ') : nominatimResult.display_name;
  };

  // Check if address belongs to partner municipality
  const checkPartnerMunicipality = (address: string) => {
    const lowerAddress = address.toLowerCase();
    let foundMunicipality = null;
    
    for (const [cityName, municipalityCode] of Object.entries(partnerMunicipalities)) {
      if (lowerAddress.includes(cityName)) {
        foundMunicipality = municipalityCode;
        break;
      }
    }
    
    if (onPartnerMunicipalityChange) {
      onPartnerMunicipalityChange(foundMunicipality);
    }
    
    return foundMunicipality;
  };

  // Enhanced address search with better parameters and caching
  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Check cache first
    if (searchCacheRef.current.has(query)) {
      const cachedResults = searchCacheRef.current.get(query)!;
      setAddressSuggestions(cachedResults);
      setShowSuggestions(cachedResults.length > 0);
      return;
    }

    setIsSearching(true);
    
    try {
      // Enhanced search parameters for better German address results
      const searchParams = new URLSearchParams({
        format: 'json',
        addressdetails: '1',
        limit: '7',
        countrycodes: 'DE',
        'accept-language': 'de',
        bounded: '1',
        viewbox: `${NUREMBERG_BOUNDS.west},${NUREMBERG_BOUNDS.south},${NUREMBERG_BOUNDS.east},${NUREMBERG_BOUNDS.north}`,
        q: query
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${searchParams}`,
        {
          headers: {
            'User-Agent': 'WasteBinReporter/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const data = await response.json();
      
      const suggestions: AddressSuggestion[] = data
        .filter((item: any) => {
          // Filter for relevant address types
          return item.type === 'house' || 
                 item.type === 'building' || 
                 item.type === 'address' ||
                 item.class === 'place' ||
                 (item.address && (item.address.house_number || item.address.road));
        })
        .map((item: any) => ({
          display_name: item.display_name,
          formatted_address: formatAddress(item),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          place_id: item.place_id,
          relevance: calculateRelevance(item, query)
        }))
        .sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
      
      // Cache results
      searchCacheRef.current.set(query, suggestions);
      
      // Limit cache size
      if (searchCacheRef.current.size > 50) {
        const firstKey = searchCacheRef.current.keys().next().value;
        searchCacheRef.current.delete(firstKey);
      }
      
      setAddressSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
      
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      toast({
        title: "Suchfehler",
        description: "Adresssuche momentan nicht verfügbar. Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  // Calculate relevance score for sorting
  const calculateRelevance = (item: any, query: string): number => {
    let score = 0;
    const lowerQuery = query.toLowerCase();
    const address = item.address || {};
    
    // Boost if query matches street name
    if (address.road && address.road.toLowerCase().includes(lowerQuery)) {
      score += 10;
    }
    
    // Boost if has house number
    if (address.house_number) {
      score += 5;
    }
    
    // Boost if in partner municipalities
    const city = (address.city || address.town || '').toLowerCase();
    if (Object.keys(partnerMunicipalities).some(key => city.includes(key))) {
      score += 8;
    }
    
    // Boost if query matches house number
    if (address.house_number && lowerQuery.includes(address.house_number)) {
      score += 15;
    }
    
    return score;
  };

  // Debounced search function
  const debouncedSearch = useCallback((query: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      searchAddresses(query);
    }, 300);
  }, [searchAddresses]);

  // Enhanced geolocation with better reverse geocoding
  const handleLocationCapture = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation nicht unterstützt",
        description: "Ihr Browser unterstützt keine Standortbestimmung.",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    
    const options = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coords = { lat: latitude, lng: longitude };
        setCoordinates(coords);

        try {
          // Enhanced reverse geocoding with zoom level for house numbers
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18&accept-language=de`
          );
          const data = await response.json();
          const address = formatAddress(data);
          
          onChange(address, coords);
          checkPartnerMunicipality(address);
          setIsGettingLocation(false);
          toast({
            title: "Standort erfasst!",
            description: `Genauigkeit: ±${Math.round(position.coords.accuracy)}m`,
          });
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          onChange(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, coords);
          setIsGettingLocation(false);
          toast({
            title: "Standort erfasst!",
            description: "GPS-Koordinaten wurden hinzugefügt.",
          });
        }
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = "Standort konnte nicht ermittelt werden.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Standortzugriff wurde verweigert.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Standortinformationen sind nicht verfügbar.";
            break;
          case error.TIMEOUT:
            errorMessage = "Zeitüberschreitung bei der Standortbestimmung.";
            break;
        }
        
        toast({
          title: "Standortfehler",
          description: errorMessage,
          variant: "destructive",
        });
      },
      options
    );
  };

  const handleLocationInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    debouncedSearch(inputValue);
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    const coords = { lat: suggestion.lat, lng: suggestion.lng };
    setCoordinates(coords);
    onChange(suggestion.formatted_address, coords);
    checkPartnerMunicipality(suggestion.formatted_address);
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const toggleMap = () => {
    setShowMap(!showMap);
  };

  // Highlight matching text in suggestions
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-medium">{part}</span>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📍 Standort *
        </label>
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <div className="relative">
              <Input
                placeholder="Straße Hausnummer, PLZ Ort (z.B. Hauptmarkt 18, 90403 Nürnberg)"
                value={value}
                onChange={handleLocationInput}
                onFocus={() => setShowSuggestions(addressSuggestions.length > 0)}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                className="flex-1 pr-8"
              />
              {isSearching && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                </div>
              )}
              {!isSearching && value.length >= 3 && (
                <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              )}
            </div>
            
            {/* Enhanced Address Suggestions Dropdown */}
            {showSuggestions && addressSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                {addressSuggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.place_id || suggestion.lat}-${index}`}
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="text-sm font-medium text-gray-800">
                      {suggestion.formatted_address}
                    </div>
                    {suggestion.display_name !== suggestion.formatted_address && (
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {suggestion.display_name}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            
            {/* No results message */}
            {showSuggestions && addressSuggestions.length === 0 && value.length >= 3 && !isSearching && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 p-4">
                <div className="text-sm text-gray-500 text-center">
                  Keine Adressen gefunden. Versuchen Sie eine andere Schreibweise oder geben Sie die Adresse manuell ein.
                </div>
              </div>
            )}
          </div>
          <Button
            type="button"
            onClick={handleLocationCapture}
            variant="outline"
            className="whitespace-nowrap"
            disabled={isGettingLocation}
          >
            {isGettingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <MapPin className="w-4 h-4 mr-1" />
            )}
            GPS
          </Button>
        </div>
      </div>

      {/* Map Preview with toggle functionality */}
      {coordinates && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              🗺️ Standort-Vorschau
            </label>
            <Button
              type="button"
              onClick={toggleMap}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {showMap ? (
                <>
                  <EyeOff className="w-3 h-3 mr-1" />
                  Karte ausblenden
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  Karte anzeigen
                </>
              )}
            </Button>
          </div>
          
          {showMap && (
            <>
              <div 
                ref={mapRef}
                className="w-full h-48 bg-gray-100 rounded-lg border relative z-10"
                style={{ minHeight: '192px' }}
              />
              <p className="text-xs text-gray-500">
                📌 Sie können den Marker auf der Karte verschieben, um die Position anzupassen
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
