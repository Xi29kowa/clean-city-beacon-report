
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { wasteBins } from '@/data/wasteBins';
import { useToast } from '@/hooks/use-toast';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface NativeLeafletMapProps {
  onWasteBasketSelect?: (binId: string, binLocation: string) => void;
}

const NativeLeafletMap: React.FC<NativeLeafletMapProps> = ({ onWasteBasketSelect }) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const userLocationMarkerRef = useRef<L.Marker | null>(null);
  const wasteBasketMarkersRef = useRef<L.Marker[]>([]);
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedWasteBasket, setSelectedWasteBasket] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const { toast } = useToast();

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map centered on Nuremberg
    mapRef.current = L.map(mapContainerRef.current, {
      center: [49.4521, 11.0767], // Nuremberg coordinates
      zoom: 13,
      zoomControl: false
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapRef.current);

    // Add zoom control to top right
    L.control.zoom({ position: 'topright' }).addTo(mapRef.current);

    // Add waste basket markers
    addWasteBasketMarkers();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Add waste basket markers to map
  const addWasteBasketMarkers = () => {
    if (!mapRef.current) return;

    // Clear existing markers
    wasteBasketMarkersRef.current.forEach(marker => marker.remove());
    wasteBasketMarkersRef.current = [];

    // Create custom icon for waste baskets
    const wasteBasketIcon = L.divIcon({
      html: `<div style="background-color: #22c55e; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
               <span style="color: white; font-size: 12px;">🗑️</span>
             </div>`,
      className: 'custom-waste-basket-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    // Add markers for each waste basket
    wasteBins.forEach(bin => {
      const marker = L.marker([bin.coordinates.lat, bin.coordinates.lng], { 
        icon: wasteBasketIcon 
      }).addTo(mapRef.current!);

      marker.bindPopup(`
        <div class="p-2">
          <h4 class="font-semibold">WasteBasket ID: ${bin.id}</h4>
          <p class="text-sm text-gray-600">${bin.location}</p>
          <p class="text-sm"><strong>Status:</strong> ${getStatusDisplay(bin.status)}</p>
          <p class="text-sm"><strong>Typ:</strong> ${getTypeDisplay(bin.type)}</p>
        </div>
      `);

      marker.on('click', () => {
        handleWasteBasketSelect(bin.id, bin.location);
      });

      wasteBasketMarkersRef.current.push(marker);
    });
  };

  // Handle waste basket selection
  const handleWasteBasketSelect = (binId: string, binLocation: string) => {
    console.log('Waste basket selected:', binId, binLocation);
    
    setSelectedWasteBasket(binId);
    
    // Update selected marker styling
    updateSelectedMarker(binId);
    
    // Call callback
    if (onWasteBasketSelect) {
      onWasteBasketSelect(binId, binLocation);
    }

    toast({
      title: "Mülleimer ausgewählt",
      description: `WasteBasket ID: ${binId}`,
    });
  };

  // Update selected marker styling
  const updateSelectedMarker = (binId: string) => {
    if (!mapRef.current) return;

    // Reset previous selected marker
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }

    // Find the waste basket
    const wasteBasket = wasteBins.find(bin => bin.id === binId);
    if (!wasteBasket) return;

    // Create selected marker icon (red)
    const selectedIcon = L.divIcon({
      html: `<div style="background-color: #ef4444; border: 3px solid white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.3); animation: pulse 2s infinite;">
               <span style="color: white; font-size: 16px;">🗑️</span>
             </div>`,
      className: 'selected-waste-basket-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // Add selected marker
    selectedMarkerRef.current = L.marker([wasteBasket.coordinates.lat, wasteBasket.coordinates.lng], { 
      icon: selectedIcon 
    }).addTo(mapRef.current);
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS nicht verfügbar",
        description: "Ihr Browser unterstützt keine Standortbestimmung.",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        
        if (mapRef.current) {
          // Add user location marker
          if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.remove();
          }

          const userIcon = L.divIcon({
            html: `<div style="background-color: #3b82f6; border: 3px solid white; border-radius: 50%; width: 20px; height: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            className: 'user-location-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          userLocationMarkerRef.current = L.marker([latitude, longitude], { 
            icon: userIcon 
          }).addTo(mapRef.current);

          userLocationMarkerRef.current.bindPopup("📍 Ihr Standort");

          // Pan to user location
          mapRef.current.setView([latitude, longitude], 16);
        }

        toast({
          title: "Standort gefunden",
          description: "Karte wurde zu Ihrem Standort navigiert.",
        });
      },
      (error) => {
        toast({
          title: "Standort nicht verfügbar",
          description: "Standortbestimmung fehlgeschlagen. Bitte erlauben Sie den Zugriff auf Ihren Standort.",
          variant: "destructive"
        });
      }
    );
  };

  // Search for address
  const searchAddress = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    
    try {
      // Use Nominatim for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Nürnberg, Germany')}&limit=1`
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 16);
          
          // Add search result marker
          const searchIcon = L.divIcon({
            html: `<div style="background-color: #f59e0b; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                     <span style="color: white; font-size: 12px;">📍</span>
                   </div>`,
            className: 'search-result-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          L.marker([lat, lng], { icon: searchIcon })
            .addTo(mapRef.current)
            .bindPopup(`📍 ${result.display_name}`)
            .openPopup();
        }

        toast({
          title: "Adresse gefunden",
          description: `Navigiert zu: ${result.display_name}`,
        });
      } else {
        toast({
          title: "Adresse nicht gefunden",
          description: "Bitte versuchen Sie eine andere Adresse.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Suchfehler",
        description: "Fehler bei der Adresssuche. Bitte versuchen Sie es erneut.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Helper functions
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'full': return '🔴 Voll';
      case 'overflowing': return '🔴 Überfüllt';
      case 'empty': return '🟢 Leer';
      case 'damaged': return '⚠️ Beschädigt';
      default: return '⚪ Unbekannt';
    }
  };

  const getTypeDisplay = (type: string) => {
    switch (type) {
      case 'general': return 'Restmüll';
      case 'recycling': return 'Wertstoff';
      case 'organic': return 'Biomüll';
      default: return 'Unbekannt';
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex gap-2">
          <Input
            type="text"
            placeholder="Adresse suchen (z.B. Hauptstraße 1, Nürnberg)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchAddress()}
            className="flex-1"
          />
          <Button
            onClick={searchAddress}
            disabled={isSearching || !searchQuery.trim()}
            size="sm"
            variant="outline"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
        <Button
          onClick={getCurrentLocation}
          size="sm"
          variant="outline"
          className="flex items-center gap-2"
        >
          <Navigation className="w-4 h-4" />
          Mein Standort
        </Button>
      </div>

      {/* Selected waste basket info */}
      {selectedWasteBasket && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm font-medium text-green-800">
            ✅ Ausgewählt: WasteBasket ID {selectedWasteBasket}
          </p>
        </div>
      )}

      {/* Map container */}
      <div className="relative">
        <div 
          ref={mapContainerRef} 
          className="w-full h-96 rounded-lg border border-gray-200 shadow-sm"
          style={{ minHeight: '400px' }}
        />
        
        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-xs">
          <h4 className="font-semibold mb-2">Legende</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-500 rounded-full border border-white"></span>
              <span>Mülleimer</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-red-500 rounded-full border border-white"></span>
              <span>Ausgewählt</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-blue-500 rounded-full border border-white"></span>
              <span>Ihr Standort</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-orange-500 rounded-full border border-white"></span>
              <span>Suchergebnis</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center">
        💡 Klicken Sie auf einen grünen Mülleimer-Marker, um ihn auszuwählen.
        {selectedWasteBasket && <span className="text-green-600 font-medium"> ✓ WasteBasket ID {selectedWasteBasket} ausgewählt</span>}
      </div>
    </div>
  );
};

export default NativeLeafletMap;
