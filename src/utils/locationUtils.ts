
import { partnerMunicipalities } from '@/data/municipalities';

export const checkPartnerMunicipality = (lat: number, lng: number): string | null => {
  for (const municipality of partnerMunicipalities) {
    const { bounds } = municipality;
    if (
      lat >= bounds.south &&
      lat <= bounds.north &&
      lng >= bounds.west &&
      lng <= bounds.east
    ) {
      return municipality.value;
    }
  }
  return null;
};

export const fetchAddressSuggestions = async (query: string) => {
  if (query.length < 3) return [];

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&countrycodes=de&addressdetails=1&bounded=1&viewbox=10.9,49.6,11.2,49.3`
    );
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching address suggestions:', error);
    return [];
  }
};

export const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
    );
    const data = await response.json();
    
    if (data.display_name) {
      const parts = data.display_name.split(',');
      return parts.slice(0, 3).join(', ').trim();
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
  }
  
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};
