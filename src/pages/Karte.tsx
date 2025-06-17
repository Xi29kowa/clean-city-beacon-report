
import { useState } from 'react';

const Karte = () => {
  const [isLoading, setIsLoading] = useState(true);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            Mülleimer-Karte Nürnberg
          </h1>
          
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {isLoading && (
              <div className="flex items-center justify-center h-96 bg-gray-100">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Karte wird geladen...</p>
                </div>
              </div>
            )}
            
            <iframe
              src="https://routenplanung.vercel.app/nbg_wastebaskets_map.html"
              className={`w-full border-0 rounded-lg ${isLoading ? 'hidden' : 'block'}`}
              style={{ height: 'max(600px, 70vh)' }}
              title="Mülleimer-Karte Nürnberg"
              loading="lazy"
              onLoad={handleIframeLoad}
              allow="geolocation"
            />
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Diese Karte zeigt alle verfügbaren Mülleimer in Nürnberg mit aktuellen Füllstandsinformationen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Karte;
