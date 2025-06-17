
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Navigation = () => (
  <div className="bg-white shadow-sm border-b sticky top-0 z-50">
    <div className="container mx-auto px-4">
      <NavigationMenu className="max-w-full">
        <NavigationMenuList className="flex-wrap">
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link 
                to="/" 
                className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
              >
                Startseite
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link 
                to="/karte" 
                className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-accent text-accent-foreground px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
              >
                Karte
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  </div>
);

const MapUpdater = ({ geoJsonData }: { geoJsonData: any }) => {
  const map = useMap();
  
  useEffect(() => {
    if (geoJsonData && geoJsonData.features && geoJsonData.features.length > 0) {
      const group = L.geoJSON(geoJsonData);
      const bounds = group.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [geoJsonData, map]);

  return null;
};

const Karte = () => {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGeoJsonData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to load from Supabase storage first
      const response = await fetch('https://eyhqkhdksvqijxdtbugv.supabase.co/storage/v1/object/public/clean-map/waste_baskets_nbg.geojson');
      
      if (response.ok) {
        const data = await response.json();
        setGeoJsonData(data);
      } else {
        throw new Error('Failed to load map data from storage');
      }
    } catch (err) {
      console.error('Error loading GeoJSON data:', err);
      setError('Kartendaten konnten nicht geladen werden. Versuchen Sie, die Karte neu zu generieren.');
    } finally {
      setLoading(false);
    }
  };

  const generateNewMap = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Trigger the GitHub Action to generate new map data
      const response = await fetch('https://api.github.com/repos/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME/actions/workflows/generate_map.yml/dispatches', {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': 'token YOUR_GITHUB_TOKEN', // You'll need to set this up
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: 'main' })
      });

      if (response.ok) {
        // Wait a bit for the workflow to complete, then reload data
        setTimeout(() => {
          loadGeoJsonData();
        }, 30000); // Wait 30 seconds
      } else {
        throw new Error('Failed to trigger map generation');
      }
    } catch (err) {
      console.error('Error generating new map:', err);
      setError('Karte konnte nicht neu generiert werden. Bitte versuchen Sie es später erneut.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGeoJsonData();
  }, []);

  const onEachFeature = (feature: any, layer: any) => {
    if (feature.properties) {
      const popupContent = `
        <div class="p-2">
          <h3 class="font-semibold text-sm mb-1">Mülleimer</h3>
          ${feature.properties.name ? `<p class="text-xs"><strong>Name:</strong> ${feature.properties.name}</p>` : ''}
          ${feature.properties.address ? `<p class="text-xs"><strong>Adresse:</strong> ${feature.properties.address}</p>` : ''}
          ${feature.properties.description ? `<p class="text-xs"><strong>Beschreibung:</strong> ${feature.properties.description}</p>` : ''}
        </div>
      `;
      layer.bindPopup(popupContent);
    }
  };

  const pointToLayer = (feature: any, latlng: any) => {
    return L.circleMarker(latlng, {
      radius: 6,
      fillColor: '#10b981',
      color: '#059669',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Mülleimer-Karte Nürnberg
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
              <Button 
                onClick={loadGeoJsonData} 
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Laden...' : 'Karte aktualisieren'}
              </Button>
              <Button 
                onClick={generateNewMap} 
                disabled={loading}
              >
                {loading ? 'Generiere...' : 'Neue Karte generieren'}
              </Button>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="h-[600px] w-full rounded-lg overflow-hidden border border-gray-200">
              <MapContainer
                center={[49.4521, 11.0767]} // Nuremberg coordinates
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {geoJsonData && (
                  <>
                    <GeoJSON
                      data={geoJsonData}
                      onEachFeature={onEachFeature}
                      pointToLayer={pointToLayer}
                    />
                    <MapUpdater geoJsonData={geoJsonData} />
                  </>
                )}
              </MapContainer>
            </div>
            
            {geoJsonData && (
              <div className="mt-4 text-center text-sm text-gray-600">
                {geoJsonData.features ? `${geoJsonData.features.length} Mülleimer gefunden` : 'Karte geladen'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Karte;
