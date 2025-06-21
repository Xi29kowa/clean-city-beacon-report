
import { Municipality } from '@/types/location';

export const partnerMunicipalities: Municipality[] = [
  { 
    value: 'nuernberg', 
    label: 'Nürnberg',
    bounds: {
      north: 49.5172,
      south: 49.3697,
      east: 11.1658,
      west: 10.9648
    }
  },
  { 
    value: 'erlangen', 
    label: 'Erlangen',
    bounds: {
      north: 49.6406,
      south: 49.5594,
      east: 11.0789,
      west: 10.9789
    }
  },
  { 
    value: 'fuerth', 
    label: 'Fürth',
    bounds: {
      north: 49.5089,
      south: 49.4533,
      east: 11.0233,
      west: 10.9533
    }
  }
];
