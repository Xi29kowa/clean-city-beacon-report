
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf } from "lucide-react";
import { useNavigate, useLocation } from 'react-router-dom';
import InteractiveMap from '@/components/InteractiveMap';
import ReportForm from '@/components/ReportForm';
import ProductList from '@/components/ProductList';
import AboutUs from '@/components/AboutUs';
import InformationPage from '@/components/InformationPage';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedBasketId, setSelectedBasketId] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const [showLoginMessage, setShowLoginMessage] = useState(false);

  const currentView = new URLSearchParams(location.search).get('view') || 'home';

  useEffect(() => {
    if (!isLoggedIn && currentView === 'report') {
      setShowLoginMessage(true);
    } else {
      setShowLoginMessage(false);
    }
  }, [isLoggedIn, currentView]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting user location:", error);
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }, []);

  const handleWasteBasketSelect = (binId: string) => {
    console.log('Selected waste basket:', binId);
    setSelectedBasketId(binId);
    
    // For now, we'll set a mock location since we don't have the waste_bins table
    setSelectedLocation(`Mock location for bin ${binId}`);
  };

  const navigateTo = (view: string) => {
    navigate(`/?view=${view}`);
  };

  const renderHeader = () => (
    <header className="bg-white shadow-sm border-b border-green-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between w-full min-h-[48px]">
          {/* Logo - Fixed width to prevent shifting */}
          <div className="flex items-center space-x-2 cursor-pointer w-48 flex-shrink-0" onClick={() => navigateTo('home')}>
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-green-800 whitespace-nowrap">Green Bin</h1>
          </div>

          {/* Desktop Navigation - Centered with fixed spacing */}
          <nav className="hidden md:flex items-center justify-center flex-1 max-w-2xl mx-auto">
            <div className="flex items-center space-x-6">
              <Button 
                onClick={() => navigateTo('report')}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-semibold shadow-md transform transition hover:scale-105"
                disabled={showLoginMessage}
              >
                Mülleimer melden
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigateTo('karte')}
                className="px-4 py-2 rounded-md transition-colors whitespace-nowrap min-w-[100px] text-gray-600 hover:text-green-600 hover:bg-green-50"
              >
                Karte
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigateTo('home')}
                className="px-4 py-2 rounded-md transition-colors whitespace-nowrap min-w-[100px] text-gray-600 hover:text-green-600 hover:bg-green-50"
              >
                Startseite
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigateTo('products')}
                className="px-4 py-2 rounded-md transition-colors whitespace-nowrap min-w-[100px] text-gray-600 hover:text-green-600 hover:bg-green-50"
              >
                Produkte
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigateTo('about')}
                className="px-4 py-2 rounded-md transition-colors whitespace-nowrap min-w-[100px] text-gray-600 hover:text-green-600 hover:bg-green-50"
              >
                Über uns
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigateTo('info')}
                className="px-4 py-2 rounded-md transition-colors whitespace-nowrap min-w-[100px] text-gray-600 hover:text-green-600 hover:bg-green-50"
              >
                Informationen
              </Button>
            </div>
          </nav>

          {/* User Authentication - Conditional rendering based on login status */}
          <div className="hidden md:flex items-center justify-end w-48 flex-shrink-0">
            {isLoggedIn ? (
              <Button onClick={() => navigateTo('account')}>Konto</Button>
            ) : (
              <Button onClick={() => navigateTo('login')}>Anmelden</Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );

  return (
    <div>
      {renderHeader()}

      <main className="container mx-auto px-4 py-8">
        {showLoginMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Anmeldung erforderlich!</strong>
            <span className="block sm:inline"> Um eine Meldung zu erstellen, musst du dich anmelden.</span>
            <div className="absolute top-0 bottom-0 right-0 px-4 py-3">
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
            </div>
          </div>
        )}

        {currentView === 'home' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Willkommen bei Green Bin</h1>
            <p className="text-gray-700">
              Green Bin ist eine Plattform, die es Bürgern ermöglicht, die Sauberkeit ihrer Stadt aktiv mitzugestalten. Melde verschmutzte oder überfüllte Mülleimer und hilf uns, unsere Stadt sauberer zu machen!
            </p>
            <Button onClick={() => navigateTo('report')} disabled={showLoginMessage}>Mülleimer melden</Button>
          </div>
        )}

        {currentView === 'report' && (
          <ReportForm selectedLocation={selectedLocation} selectedBasketId={selectedBasketId} />
        )}

        {currentView === 'products' && (
          <ProductList />
        )}

        {currentView === 'about' && (
          <AboutUs />
        )}

        {currentView === 'info' && (
          <InformationPage />
        )}

        {currentView === 'karte' && (
          <div className="space-y-6">
            <InteractiveMap
              onWasteBinSelect={handleWasteBasketSelect}
              center={userLocation ? { lat: userLocation[0], lng: userLocation[1] } : null}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
