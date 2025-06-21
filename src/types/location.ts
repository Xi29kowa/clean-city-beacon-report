
export interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export interface WasteBin {
  id: string;
  location: string;
  lat: number;
  lng: number;
  fillLevel: 'high' | 'medium' | 'low';
}

export interface Municipality {
  value: string;
  label: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface LocationPickerProps {
  value: string;
  onChange: (location: string, coordinates?: { lat: number; lng: number }) => void;
  onPartnerMunicipalityChange: (municipality: string | null) => void;
  onWasteBinSelect?: (binId: string, location: string) => void;
}
