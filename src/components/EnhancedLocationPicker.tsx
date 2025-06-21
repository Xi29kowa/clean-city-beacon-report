
import React, { useState } from 'react';
import { LocationPickerProps, WasteBin } from '@/types/location';
import { wasteBins } from '@/data/wasteBins';
import AddressInput from './AddressInput';
import WasteBinDisplay from './WasteBinDisplay';
import InteractiveMap from './InteractiveMap';

const EnhancedLocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  onPartnerMunicipalityChange,
  onWasteBinSelect
}) => {
  const [selectedWasteBin, setSelectedWasteBin] = useState<WasteBin | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  const handleWasteBinSelect = (binId: string) => {
    console.log('Waste bin selected in EnhancedLocationPicker:', binId);
    const selectedBin = wasteBins.find(bin => bin.id === binId);
    
    if (selectedBin) {
      setSelectedWasteBin(selectedBin);
      if (onWasteBinSelect) {
        onWasteBinSelect(selectedBin.id, selectedBin.location);
      }
    } else {
      // Handle bins not in our dataset
      console.log('Creating mock bin for ID:', binId);
      const mockBin: WasteBin = {
        id: binId,
        location: `Standort ${binId}`,
        coordinates: { lat: 49.4521, lng: 11.0767 },
        status: 'empty',
        lastEmptied: new Date().toISOString(),
        type: 'general'
      };
      setSelectedWasteBin(mockBin);
      if (onWasteBinSelect) {
        onWasteBinSelect(mockBin.id, mockBin.location);
      }
    }
  };

  const handleDeselectWasteBin = () => {
    setSelectedWasteBin(null);
    if (onWasteBinSelect) {
      onWasteBinSelect('', '');
    }
  };

  const handleLocationSelect = (coordinates: { lat: number; lng: number }) => {
    console.log('Location selected, navigating map to:', coordinates);
    // Immediately update map center to navigate to the selected location
    setMapCenter(coordinates);
  };

  const handleAddressChange = (location: string, coordinates?: { lat: number; lng: number }) => {
    onChange(location, coordinates);
    
    // If coordinates are provided, navigate the map immediately
    if (coordinates) {
      console.log('Address changed, navigating map to:', coordinates);
      setMapCenter(coordinates);
    }
  };

  return (
    <div className="space-y-4">
      <AddressInput
        value={value}
        onChange={handleAddressChange}
        onPartnerMunicipalityChange={onPartnerMunicipalityChange}
        onLocationSelect={handleLocationSelect}
      />

      {selectedWasteBin && (
        <WasteBinDisplay
          wasteBin={selectedWasteBin}
          onDeselect={handleDeselectWasteBin}
        />
      )}

      <InteractiveMap 
        onWasteBinSelect={handleWasteBinSelect}
        center={mapCenter}
      />
    </div>
  );
};

export default EnhancedLocationPicker;
