
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
    const selectedBin = wasteBins.find(bin => bin.id === binId);
    
    if (selectedBin) {
      setSelectedWasteBin(selectedBin);
      if (onWasteBinSelect) {
        onWasteBinSelect(selectedBin.id, selectedBin.location);
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
    setMapCenter(coordinates);
  };

  return (
    <div className="space-y-4">
      <AddressInput
        value={value}
        onChange={onChange}
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
