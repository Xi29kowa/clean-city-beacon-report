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
      console.log('🎯 RECEIVED MESSAGE:');
      console.log('   - Origin:', event.origin);
      console.log('   - Data type:', typeof event.data);
      console.log('   - Data:', event.data);
      
      // Allow ALL origins temporarily for debugging
      console.log('✅ PROCESSING MESSAGE (all origins allowed)');
      
      // Handle map ready
      if (event.data && event.data.type === 'mapReady') {
        console.log('✅ MAP READY MESSAGE RECEIVED');
        setIsMapReady(true);
        setIsMapLoading(false);
        
        // Send pending navigation
        if (pendingNavigationRef.current && mapIframeRef.current) {
          console.log('🧭 Sending pending navigation:', pendingNavigationRef.current);
          const navigationMessage = {
            type: 'navigateToLocation',
            coordinates: pendingNavigationRef.current,
            zoom: 17
          };
          mapIframeRef.current.contentWindow?.postMessage(navigationMessage, '*');
          pendingNavigationRef.current = null;
        }
        return;
      }
      
      // Handle ALL possible waste bin click formats
      let binId = null;
      let foundFormat = '';
      
      if (event.data && typeof event.data === 'object') {
        // Check all possible property names for the bin ID
        const possibleProperties = [
          'wasteBasketId',
          'wasteBinId', 
          'binId',
          'id',
          'markerId',
          'basket_id',
          'bin_id',
          'WasteBasketId',
          'WasteBinId'
        ];
        
        for (const prop of possibleProperties) {
          if (event.data[prop] !== undefined && event.data[prop] !== null) {
            binId = event.data[prop];
            foundFormat = prop;
            break;
          }
        }
        
        // Also check nested data objects
        if (!binId && event.data.data && typeof event.data.data === 'object') {
          for (const prop of possibleProperties) {
            if (event.data.data[prop] !== undefined && event.data.data[prop] !== null) {
              binId = event.data.data[prop];
              foundFormat = `data.${prop}`;
              break;
            }
          }
        }
      }
      
      // Try to parse string messages
      if (!binId && typeof event.data === 'string') {
        try {
          const parsed = JSON.parse(event.data);
          console.log('📝 Parsed string message:', parsed);
          
          const possibleProperties = ['wasteBasketId', 'wasteBinId', 'binId', 'id', 'markerId'];
          for (const prop of possibleProperties) {
            if (parsed[prop] !== undefined && parsed[prop] !== null) {
              binId = parsed[prop];
              foundFormat = `string.${prop}`;
              break;
            }
          }
        } catch (e) {
          console.log('❌ Could not parse string message');
        }
      }
      
      // If we found a bin ID, process it
      if (binId !== null && binId !== undefined) {
        const binIdString = String(binId);
        console.log('🗑️ WASTE BIN CLICK DETECTED:');
        console.log('   - Bin ID:', binIdString);
        console.log('   - Found in format:', foundFormat);
        console.log('   - Message type:', event.data?.type || 'unknown');
        
        // CRITICAL: Call the callback to update the parent component
        if (onWasteBinSelect) {
          console.log('📤 CALLING onWasteBinSelect with:', binIdString);
          onWasteBinSelect(binIdString);
        } else {
          console.log('❌ onWasteBinSelect callback not available!');
        }
        
        // Find and display bin data
        const bin = wasteBins.find(b => b.id === binIdString);
        if (bin) {
          console.log('✅ Found bin data:', bin);
          setSelectedBin(bin);
        } else {
          console.log('⚠️ Creating mock data for bin:', binIdString);
          const mockBin: WasteBin = {
            id: binIdString,
            location: `Standort ${binIdString}`,
            coordinates: { lat: 49.4521, lng: 11.0767 },
            status: 'empty',
            lastEmptied: new Date().toISOString(),
            type: 'general'
          };
          setSelectedBin(mockBin);
        }
      } else {
        // Log when no bin ID is found for debugging
        console.log('❌ No bin ID found in message');
        if (event.data && typeof event.data === 'object') {
          console.log('Available properties:', Object.keys(event.data));
        }
      }
    };

    // Add message listener
    window.addEventListener('message', handleMapMessage);
    console.log('👂 Message listener added for ALL origins');
    
    return () => {
      window.removeEventListener('message', handleMapMessage);
      console.log('🔇 Message listener removed');
    };
  }, [onWasteBinSelect]);

  // Handle iframe load
  const handleIframeLoad = () => {
    console.log('🌐 Iframe loaded');
    // Give iframe time to initialize, then assume ready
    setTimeout(() => {
      if (!isMapReady) {
        console.log('⏰ Map ready timeout, assuming ready');
        setIsMapReady(true);
        setIsMapLoading(false);
      }
    }, 2000);
  };

  // Send navigation to map when center changes
  useEffect(() => {
    if (center) {
      console.log('🧭 Navigation requested to:', center);
      
      if (mapIframeRef.current && isMapReady) {
        console.log('📍 Navigating map immediately');
        const navigationMessage = {
          type: 'navigateToLocation',
          coordinates: center,
          zoom: 17
        };
        mapIframeRef.current.contentWindow?.postMessage(navigationMessage, '*');
      } else {
        console.log('⏳ Map not ready, storing pending navigation');
        pendingNavigationRef.current = center;
        
        // Multiple retry attempts
        const attempts = [500, 1000, 2000, 3000];
        attempts.forEach((delay, index) => {
          setTimeout(() => {
            if (mapIframeRef.current && pendingNavigationRef.current) {
              console.log(`🔄 Retry ${index + 1}: Navigation attempt`);
              const navigationMessage = {
                type: 'navigateToLocation',
                coordinates: pendingNavigationRef.current,
                zoom: 17
              };
              mapIframeRef.current.contentWindow?.postMessage(navigationMessage, '*');
              
              if (index === attempts.length - 1) {
                pendingNavigationRef.current = null;
              }
            }
          }, delay);
        });
      }
    }
  }, [center, isMapReady]);

  // Helper functions for display
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

  const getFillLevel = (status: string): number => {
    switch (status) {
      case 'empty': return 10;
      case 'full': return 85;
      case 'overflowing': return 100;
      case 'damaged': return 0;
      default: return Math.floor(Math.random() * 80) + 10;
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
        
        {/* Selected Waste Bin Display */}
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
            💡 Klicken Sie auf einen Mülleimer-Marker um die ID automatisch zu übernehmen.
            {isMapLoading && <span className="text-orange-600">(Lädt...)</span>}
            {!isMapLoading && isMapReady && <span className="text-green-600">(Bereit)</span>}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;
