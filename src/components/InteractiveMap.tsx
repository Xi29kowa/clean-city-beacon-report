import React, { useRef, useEffect, useState } from 'react';
import { MapPin, Trash2, Loader2 } from 'lucide-react';
import { WasteBin } from '@/types/location';
import { wasteBins } from '@/data/wasteBins';

interface InteractiveMapProps {
  onWasteBinSelect?: (binId: string) => void;
  center?: { lat: number; lng: number } | null;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ onWasteBinSelect, center }) => {
  const mapIframeRef = useRef<HTMLIFrameElement>(null);
  const [selectedBin, setSelectedBin] = useState<WasteBin | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const pendingNavigationRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const handleMapMessage = (event: MessageEvent) => {
      console.log('🎯 Received message from:', event.origin);
      console.log('📨 Message data:', event.data);
      
      // Accept messages from multiple possible origins, including Lovable domains
      const allowedOrigins = [
        'https://routenplanung.vercel.app',
        'http://localhost:3000',
        'http://localhost:5173',
        'https://nbg-wastebaskets-map.vercel.app'
      ];
      
      // Also allow any Lovable domain
      const isLovableDomain = event.origin.includes('.lovable.app');
      const isAllowedOrigin = allowedOrigins.includes(event.origin) || isLovableDomain;
      
      if (!isAllowedOrigin) {
        console.log('❌ Message rejected from origin:', event.origin);
        return;
      }
      
      console.log('✅ Message accepted from origin:', event.origin);
      
      if (event.data.type === 'mapReady') {
        console.log('✅ Map is ready!');
        setIsMapReady(true);
        setIsMapLoading(false);
        
        // Send any pending navigation
        if (pendingNavigationRef.current && mapIframeRef.current) {
          console.log('🧭 Sending pending navigation:', pendingNavigationRef.current);
          const navigationMessage = {
            type: 'navigateToLocation',
            coordinates: pendingNavigationRef.current,
            zoom: 17
          };
          mapIframeRef.current.contentWindow?.postMessage(navigationMessage, event.origin);
          pendingNavigationRef.current = null;
        }
      }
      
      // Handle different possible message formats for waste bin clicks
      if (event.data.type === 'wasteBinClick' || event.data.type === 'wasteBasketClick' || event.data.type === 'binClick') {
        const binId = event.data.binId || event.data.wasteBasketId || event.data.id;
        console.log('🗑️ Waste bin clicked in InteractiveMap, ID:', binId);
        
        if (!binId) {
          console.log('❌ No bin ID found in message data:', event.data);
          return;
        }
        
        // IMPORTANT: Call the callback to inform parent component
        if (onWasteBinSelect) {
          console.log('📤 Calling onWasteBinSelect with binId:', binId);
          onWasteBinSelect(binId);
        } else {
          console.log('❌ onWasteBinSelect callback not available');
        }
        
        // Find the waste bin data for display
        const bin = wasteBins.find(b => b.id === binId);
        if (bin) {
          console.log('✅ Found bin data:', bin);
          setSelectedBin(bin);
        } else {
          console.log('⚠️ Bin not found in data, creating mock data for:', binId);
          // Create mock data for bins not in our dataset
          const mockBin: WasteBin = {
            id: binId,
            location: `Standort ${binId}`,
            coordinates: { lat: 49.4521, lng: 11.0767 },
            status: 'empty',
            lastEmptied: new Date().toISOString(),
            type: 'general'
          };
          setSelectedBin(mockBin);
        }
      }
      
      // Handle any click events that might contain waste bin info
      if (event.data.type === 'click' && (event.data.wasteBasketId || event.data.binId)) {
        const binId = event.data.wasteBasketId || event.data.binId;
        console.log('🖱️ Generic click with bin ID:', binId);
        
        if (onWasteBinSelect) {
          console.log('📤 Calling onWasteBinSelect from generic click:', binId);
          onWasteBinSelect(binId);
        }
      }

      // Handle any message that contains wastebasket data
      if (event.data.wasteBasketId || event.data.binId || event.data.id) {
        const binId = event.data.wasteBasketId || event.data.binId || event.data.id;
        console.log('🔍 Found potential bin ID in message:', binId, 'Type:', event.data.type);
        
        if (onWasteBinSelect && binId) {
          console.log('📤 Calling onWasteBinSelect with found binId:', binId);
          onWasteBinSelect(binId);
        }
      }
    };

    // Add comprehensive message listener
    window.addEventListener('message', handleMapMessage);
    console.log('👂 Message listener added');
    
    return () => {
      window.removeEventListener('message', handleMapMessage);
      console.log('🔇 Message listener removed');
    };
  }, [onWasteBinSelect]);

  // Handle iframe load
  const handleIframeLoad = () => {
    console.log('🌐 Iframe loaded');
    // Give the iframe a moment to initialize
    setTimeout(() => {
      if (!isMapReady) {
        console.log('⏰ Map ready timeout, assuming ready');
        setIsMapReady(true);
        setIsMapLoading(false);
      }
    }, 2000);
  };

  // Send navigation command to map when center changes
  useEffect(() => {
    if (center) {
      console.log('🧭 Navigation requested to:', center);
      
      if (mapIframeRef.current && isMapReady) {
        console.log('📍 Navigating map to coordinates immediately:', center);
        const navigationMessage = {
          type: 'navigateToLocation',
          coordinates: center,
          zoom: 17
        };
        
        // Send message to iframe
        mapIframeRef.current.contentWindow?.postMessage(navigationMessage, 'https://routenplanung.vercel.app');
      } else {
        console.log('⏳ Map not ready, storing pending navigation:', center);
        pendingNavigationRef.current = center;
        
        // Try multiple times with increasing delays
        const attempts = [500, 1000, 2000, 3000];
        attempts.forEach((delay, index) => {
          setTimeout(() => {
            if (mapIframeRef.current && pendingNavigationRef.current) {
              console.log(`🔄 Retry ${index + 1}: Attempting navigation to:`, pendingNavigationRef.current);
              const navigationMessage = {
                type: 'navigateToLocation',
                coordinates: pendingNavigationRef.current,
                zoom: 17
              };
              mapIframeRef.current.contentWindow?.postMessage(navigationMessage, 'https://routenplanung.vercel.app');
              
              // Clear pending navigation after successful attempt
              if (index === attempts.length - 1) {
                pendingNavigationRef.current = null;
              }
            }
          }, delay);
        });
      }
    }
  }, [center, isMapReady]);

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

  // Calculate fill level percentage based on status
  const getFillLevel = (status: string): number => {
    switch (status) {
      case 'empty': return 10;
      case 'full': return 85;
      case 'overflowing': return 100;
      case 'damaged': return 0;
      default: return Math.floor(Math.random() * 80) + 10; // Random between 10-90%
    }
  };

  const getFillLevelColor = (fillLevel: number): string => {
    if (fillLevel >= 90) return 'text-red-600';
    if (fillLevel >= 70) return 'text-orange-600';
    if (fillLevel >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        🗺️ Interaktive Karte mit Mülleimern
      </label>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="relative">
          <iframe 
            ref={mapIframeRef}
            src="https://routenplanung.vercel.app/nbg_wastebaskets_map.html"
            className="w-full h-96 border-0 rounded-t-lg"
            title="Interaktive Mülleimer Karte"
            style={{ minHeight: '384px' }}
            onLoad={handleIframeLoad}
            allow="geolocation"
          />
          
          {/* Loading overlay */}
          {isMapLoading && (
            <div className="absolute inset-0 bg-gray-100 rounded-t-lg flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Karte wird geladen...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Selected Waste Bin Display with Enhanced Information */}
        {selectedBin && (
          <div className="p-4 bg-blue-50 border-t border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-800 mb-2">Ausgewählter Mülleimer</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-blue-700">
                      <span className="font-medium">WasteBasket ID:</span> {selectedBin.id}
                    </p>
                    <p className="text-blue-700">
                      <span className="font-medium">Standort:</span> {selectedBin.location}
                    </p>
                    <p className="text-blue-700">
                      <span className="font-medium">Status:</span> {getStatusDisplay(selectedBin.status)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-blue-700">
                      <span className="font-medium">Typ:</span> {getTypeDisplay(selectedBin.type)}
                    </p>
                    <p className={`font-medium ${getFillLevelColor(getFillLevel(selectedBin.status))}`}>
                      <span className="text-blue-700 font-medium">Füllstand:</span> {getFillLevel(selectedBin.status)}%
                    </p>
                    <p className="text-blue-700 text-xs">
                      <span className="font-medium">Koordinaten:</span> {selectedBin.coordinates.lat.toFixed(6)}, {selectedBin.coordinates.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-3 bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-600 flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            💡 Klicken Sie auf einen Mülleimer-Marker um die ID automatisch zu übernehmen und Details anzuzeigen.
            {isMapLoading && <span className="text-orange-600">(Lädt...)</span>}
            {!isMapLoading && isMapReady && <span className="text-green-600">(Bereit)</span>}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            🔍 Debug: Schauen Sie in die Browser-Konsole für Message-Logs
          </p>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;
