
import { WasteBin } from '@/types/location';

export const wasteBins: WasteBin[] = [
  { 
    id: 'bin_1', 
    location: 'Lange Gasse 20', 
    coordinates: { lat: 49.4521, lng: 11.0767 }, 
    status: 'full',
    lastEmptied: '2024-06-20T10:00:00Z',
    type: 'general'
  },
  { 
    id: 'bin_2', 
    location: 'Hauptmarkt 18', 
    coordinates: { lat: 49.4545, lng: 11.0778 }, 
    status: 'empty',
    lastEmptied: '2024-06-21T08:30:00Z',
    type: 'recycling'
  },
  { 
    id: 'bin_3', 
    location: 'Königstraße 5', 
    coordinates: { lat: 49.4533, lng: 11.0785 }, 
    status: 'overflowing',
    lastEmptied: '2024-06-19T14:15:00Z',
    type: 'general'
  },
  { 
    id: 'bin_4', 
    location: 'Lorenzkirche', 
    coordinates: { lat: 49.4492, lng: 11.0788 }, 
    status: 'full',
    lastEmptied: '2024-06-20T16:45:00Z',
    type: 'organic'
  },
  { 
    id: 'bin_5', 
    location: 'Albrecht-Dürer-Platz', 
    coordinates: { lat: 49.4567, lng: 11.0801 }, 
    status: 'empty',
    lastEmptied: '2024-06-21T09:20:00Z',
    type: 'recycling'
  }
];
