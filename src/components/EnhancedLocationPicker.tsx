
import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from 'lucide-react';

interface EnhancedLocationPickerProps {
  value: string;
  onChange: (location: string, coordinates?: { lat: number; lng: number }) => void;
  onPartnerMunicipalityChange: (municipality: string | null) => void;
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

const EnhancedLocationPicker: React.FC<EnhancedLocationPickerProps> = ({
  value,
  onChange,
  onPartnerMunicipalityChange
}) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
          // Reverse geocoding to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          
          let address = '';
          if (data.display_name) {
            // Extract relevant parts of the address
            const parts = data.display_name.split(',');
            address = parts.slice(0, 3).join(', ').trim();
          } else {
            address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          }
          
          onChange(address, { lat: latitude, lng: longitude });
          
          // Check if location is in partner municipality
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

  // Handle address input changes and check municipality
  const handleAddressChange = async (address: string) => {
    onChange(address);
    
    if (address.length > 10) {
      try {
        // Forward geocoding to get coordinates
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          
          const municipality = checkPartnerMunicipality(lat, lng);
          onPartnerMunicipalityChange(municipality);
        } else {
          onPartnerMunicipalityChange(null);
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        onPartnerMunicipalityChange(null);
      }
    } else {
      onPartnerMunicipalityChange(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Address Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📍 Standort *
        </label>
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder="Geben Sie eine Adresse ein..."
            className="flex-1"
            required
          />
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

      {/* Enhanced Map Display */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🗺️ Karte mit vorhandenen Mülleimern
        </label>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <iframe 
            src="https://routenplanung.vercel.app/nbg_wastebaskets_map.html"
            className="w-full h-80 border-0 rounded-lg"
            title="Mülleimer Karte - Standort wählen"
            style={{ minHeight: '320px' }}
          />
          <div className="p-3 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-600 flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              Sehen Sie vorhandene Mülleimer und deren Füllstand. Klicken Sie auf die Karte, um einen Standort zu wählen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLocationPicker;
