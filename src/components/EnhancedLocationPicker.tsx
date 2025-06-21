
import React, { useState, useEffect } from 'react';
import { LocationPickerProps, WasteBin } from '@/types/location';
import { wasteBins } from '@/data/wasteBins';
import { partnerMunicipalities } from '@/data/municipalities';
import AddressInput from './AddressInput';
import WasteBinDisplay from './WasteBinDisplay';
import InteractiveMap from './InteractiveMap';
import { Input } from '@/components/ui/input';

interface EnhancedLocationPickerProps extends LocationPickerProps {
  coordinates?: { lat: number; lng: number } | null;
  onWasteBinIdChange?: (binId: string) => void;
}

const EnhancedLocationPicker: React.FC<EnhancedLocationPickerProps> = ({
  value,
  onChange,
  onPartnerMunicipalityChange,
  onWasteBinSelect,
  coordinates,
  onWasteBinIdChange
}) => {
  const [selectedWasteBin, setSelectedWasteBin] = useState<WasteBin | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(coordinates || null);
  const [wasteBinId, setWasteBinId] = useState('');
  const [selectedPartnerMunicipality, setSelectedPartnerMunicipality] = useState<string>('');

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
    // Force immediate map navigation
    setMapCenter({ ...coordinates });
  };

  const handleAddressChange = (location: string, coordinates?: { lat: number; lng: number }) => {
    console.log('Address changed:', location, coordinates);
    onChange(location, coordinates);
    
    // Force immediate map navigation when address changes
    if (coordinates) {
      console.log('Address changed, forcing map navigation to:', coordinates);
      setMapCenter({ ...coordinates });
    }
  };

  const handleWasteBinIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numeric characters
    if (value === '' || /^\d+$/.test(value)) {
      setWasteBinId(value);
      if (onWasteBinIdChange) {
        onWasteBinIdChange(value);
      }
    }
  };

  const handlePartnerMunicipalityChange = (municipality: string | null) => {
    setSelectedPartnerMunicipality(municipality || '');
    if (onPartnerMunicipalityChange) {
      onPartnerMunicipalityChange(municipality);
    }
  };

  // Update map center when coordinates prop changes
  useEffect(() => {
    if (coordinates) {
      console.log('Coordinates prop changed, updating map center:', coordinates);
      setMapCenter({ ...coordinates });
    }
  }, [coordinates?.lat, coordinates?.lng]);

  // Get municipality label for display
  const getMunicipalityLabel = (value: string) => {
    const municipality = partnerMunicipalities.find(m => m.value === value);
    return municipality ? municipality.label : value;
  };

  return (
    <div className="space-y-4">
      <AddressInput
        value={value}
        onChange={handleAddressChange}
        onPartnerMunicipalityChange={handlePartnerMunicipalityChange}
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

      {/* Mülleimer ID Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🗑️ Mülleimer ID <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          value={wasteBinId}
          onChange={handleWasteBinIdChange}
          placeholder="Nur Zahlen eingeben..."
          className="w-full"
          required
          pattern="[0-9]*"
          inputMode="numeric"
        />
      </div>

      {/* Partner Stadtverwaltung Display - Always shown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🏛️ Partner Stadtverwaltung
        </label>
        <Input
          type="text"
          value={selectedPartnerMunicipality ? getMunicipalityLabel(selectedPartnerMunicipality) : ''}
          readOnly
          placeholder="Wird automatisch basierend auf der Adresse ausgewählt"
          className={`w-full ${
            selectedPartnerMunicipality 
              ? 'bg-green-50 border-green-200 text-green-800 font-medium' 
              : 'bg-gray-50 border-gray-200 text-gray-500'
          }`}
        />
      </div>
    </div>
  );
};

export default EnhancedLocationPicker;
