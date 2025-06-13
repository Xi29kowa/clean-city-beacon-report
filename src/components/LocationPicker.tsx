
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader } from '@googlemaps/js-api-loader';

interface LocationPickerProps {
  value: string;
  onChange: (location: string, coordinates?: { lat: number; lng: number }) => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ value, onChange }) => {
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const { toast } = useToast();

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: 'YOUR_GOOGLE_MAPS_API_KEY', // You'll need to add your API key
          version: 'weekly',
          libraries: ['places', 'geocoding']
        });

        await loader.load();
        setMapLoaded(true);
      } catch (error) {
        console.log('Google Maps API not available, using fallback');
      }
    };

    initMap();
  }, []);

  // Create map when coordinates are available
  useEffect(() => {
    if (mapLoaded && coordinates && mapRef.current) {
      const map = new google.maps.Map(mapRef.current, {
        center: coordinates,
        zoom: 16,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      const marker = new google.maps.Marker({
        position: coordinates,
        map: map,
        draggable: true,
      });

      marker.addListener('dragend', async () => {
        const position = marker.getPosition();
        if (position) {
          const newCoords = { lat: position.lat(), lng: position.lng() };
          setCoordinates(newCoords);
          
          // Reverse geocode the new position
          const geocoder = new google.maps.Geocoder();
          try {
            const response = await geocoder.geocode({ location: newCoords });
            if (response.results[0]) {
              onChange(response.results[0].formatted_address, newCoords);
            }
          } catch (error) {
            console.error('Reverse geocoding failed:', error);
          }
        }
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }
  }, [mapLoaded, coordinates, onChange]);

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
          // Try Google Maps reverse geocoding first if available
          if (mapLoaded && window.google) {
            const geocoder = new google.maps.Geocoder();
            const response = await geocoder.geocode({ location: coords });
            if (response.results[0]) {
              onChange(response.results[0].formatted_address, coords);
              setIsGettingLocation(false);
              toast({
                title: "Standort erfasst!",
                description: `Genauigkeit: ±${Math.round(position.coords.accuracy)}m`,
              });
              return;
            }
          }

          // Fallback to Nominatim
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
          >
            {!mapLoaded && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">Karte wird geladen...</p>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">
            📌 Sie können den Marker auf der Karte verschieben, um die Position anzupassen
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
