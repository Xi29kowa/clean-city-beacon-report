
export interface AddressSuggestion {
  display_name: string;
  short_name?: string;
  formatted_address?: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
  importance?: number;
}

export interface WasteBin {
  id: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  status: 'empty' | 'full' | 'overflowing' | 'damaged';
  lastEmptied: string;
  type: 'general' | 'recycling' | 'organic';
}

export interface LocationPickerProps {
  value: string;
  onChange: (location: string, coordinates?: { lat: number; lng: number }) => void;
  onPartnerMunicipalityChange: (municipality: string | null) => void;
  onWasteBinSelect?: (binId: string, binLocation: string) => void;
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
