
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
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
}

const LocationPicker: React.FC<LocationPickerProps> = ({ value, onChange }) => {
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const { toast } = useToast();

  // Initialize Leaflet CSS
  useEffect(() => {
    // Add Leaflet CSS if not already added
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  // Create map when coordinates are available
  useEffect(() => {
    if (coordinates && mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([coordinates.lat, coordinates.lng], 16);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add draggable marker
      const marker = L.marker([coordinates.lat, coordinates.lng], { draggable: true }).addTo(map);

      // Handle marker drag
      marker.on('dragend', async () => {
        const position = marker.getLatLng();
        const newCoords = { lat: position.lat, lng: position.lng };
        setCoordinates(newCoords);
        
        // Reverse geocode the new position using Nominatim
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&addressdetails=1`
          );
          const data = await response.json();
          if (data.display_name) {
            onChange(data.display_name, newCoords);
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          onChange(`${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`, newCoords);
        }
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }
  }, [coordinates, onChange]);

  // Update marker position when coordinates change
  useEffect(() => {
    if (coordinates && mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([coordinates.lat, coordinates.lng]);
      mapInstanceRef.current.setView([coordinates.lat, coordinates.lng], 16);
    }
  }, [coordinates]);

  // Enhanced address autocomplete using Nominatim
  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}, Deutschland`
      );
      const data = await response.json();
      
      const suggestions = data.map((item: any) => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      }));
      
      setAddressSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
    }
  };

  // Enhanced geolocation with high accuracy
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
          // Use Nominatim for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();
          const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          
          onChange(address, coords);
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
    searchAddresses(inputValue);
  };

  const handleSuggestionClick = (suggestion: any) => {
    const coords = { lat: suggestion.lat, lng: suggestion.lng };
    setCoordinates(coords);
    onChange(suggestion.display_name, coords);
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📍 Standort *
        </label>
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Input
              placeholder="Adresse oder GPS-Koordinaten"
              value={value}
              onChange={handleLocationInput}
              onFocus={() => setShowSuggestions(addressSuggestions.length > 0)}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              className="flex-1"
            />
            
            {/* Address Suggestions Dropdown */}
            {showSuggestions && addressSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                {addressSuggestions.map((suggestion: any, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="text-sm text-gray-800">{suggestion.display_name}</div>
                  </button>
                ))}
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

      {/* Map Preview */}
      {coordinates && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            🗺️ Standort-Vorschau
          </label>
          <div 
            ref={mapRef}
            className="w-full h-48 bg-gray-100 rounded-lg border"
            style={{ minHeight: '192px' }}
          />
          <p className="text-xs text-gray-500">
            📌 Sie können den Marker auf der Karte verschieben, um die Position anzupassen
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
