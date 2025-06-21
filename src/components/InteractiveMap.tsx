
import React, { useRef, useEffect, useState } from 'react';
import { MapPin, Trash2 } from 'lucide-react';
import { WasteBin } from '@/types/location';
import { wasteBins } from '@/data/wasteBins';

interface InteractiveMapProps {
  onWasteBinSelect?: (binId: string) => void;
  center?: { lat: number; lng: number } | null;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ onWasteBinSelect, center }) => {
  const mapIframeRef = useRef<HTMLIFrameElement>(null);
  const [selectedBin, setSelectedBin] = useState<WasteBin | null>(null);

  useEffect(() => {
    const handleMapMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://routenplanung.vercel.app') return;
      
      if (event.data.type === 'wasteBinClick') {
        const { binId } = event.data;
        
        // Find the waste bin data
        const bin = wasteBins.find(b => b.id === binId);
        if (bin) {
          setSelectedBin(bin);
          if (onWasteBinSelect) {
            onWasteBinSelect(binId);
          }
        }
      }
    };

    window.addEventListener('message', handleMapMessage);
    return () => window.removeEventListener('message', handleMapMessage);
  }, [onWasteBinSelect]);

  // Send navigation command to map when center changes
  useEffect(() => {
    if (center && mapIframeRef.current) {
      const navigationMessage = {
        type: 'navigateToLocation',
        coordinates: center,
        zoom: 17 // Street-level zoom
      };
      
      mapIframeRef.current.contentWindow?.postMessage(navigationMessage, 'https://routenplanung.vercel.app');
    }
  }, [center]);

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
        
        {/* Selected Waste Bin Display */}
        {selectedBin && (
          <div className="p-4 bg-blue-50 border-t border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-800 mb-1">Ausgewählter Mülleimer</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-blue-700">
                    <span className="font-medium">ID:</span> {selectedBin.id}
                  </p>
                  <p className="text-blue-700">
                    <span className="font-medium">Standort:</span> {selectedBin.location}
                  </p>
                  <p className="text-blue-700">
                    <span className="font-medium">Status:</span> {getStatusDisplay(selectedBin.status)}
                  </p>
                  <p className="text-blue-700">
                    <span className="font-medium">Typ:</span> {getTypeDisplay(selectedBin.type)}
                  </p>
                  <p className="text-blue-700">
                    <span className="font-medium">Koordinaten:</span> {selectedBin.coordinates.lat.toFixed(6)}, {selectedBin.coordinates.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-3 bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-600 flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            Klicken Sie auf einen Mülleimer-Marker um Details anzuzeigen. Die Karte navigiert automatisch zu ausgewählten Adressen.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;
