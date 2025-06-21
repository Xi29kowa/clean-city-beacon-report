
import React, { useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';

interface InteractiveMapProps {
  onWasteBinSelect?: (binId: string) => void;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ onWasteBinSelect }) => {
  const mapIframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMapMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://routenplanung.vercel.app') return;
      
      if (event.data.type === 'wasteBinClick' && onWasteBinSelect) {
        const { binId } = event.data;
        onWasteBinSelect(binId);
      }
    };

    window.addEventListener('message', handleMapMessage);
    return () => window.removeEventListener('message', handleMapMessage);
  }, [onWasteBinSelect]);

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
        <div className="p-3 bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-600 flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            Klicken Sie auf einen Mülleimer-Marker um ihn auszuwählen. Sie können auch einen Standort ohne spezifischen Mülleimer melden.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;
