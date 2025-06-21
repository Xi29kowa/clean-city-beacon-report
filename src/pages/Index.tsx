import React, { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, Leaf, CheckCircle, ArrowRight, Upload, Menu, X, Info, Shield, Phone, User, LogIn, Share2, Copy, Wifi, Battery, Zap, Database, Monitor, LogOut, Navigation } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";
import UserDropdown from "@/components/UserDropdown";
import NotificationDialog from "@/components/NotificationDialog";
import LocationPicker from "@/components/LocationPicker";
import { useStatistics } from "@/hooks/useStatistics";
import { useBinReports } from "@/hooks/useBinReports";
import EnhancedLocationPicker from "@/components/EnhancedLocationPicker";

const Index = () => {
  const [currentView, setCurrentView] = useState('home');
  const [showMenu, setShowMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [formData, setFormData] = useState({
    location: '',
    photo: null,
    issueType: '',
    comment: '',
    partnerMunicipality: '',
    wasteBinId: ''
  });
  const [locationCoordinates, setLocationCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [displayCount, setDisplayCount] = useState(0);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [canSubmitReport, setCanSubmitReport] = useState(false);
  
  // Map specific state
  const [mapAddress, setMapAddress] = useState('');
  const [selectedWasteBasket, setSelectedWasteBasket] = useState('');
  const [selectedWasteBasketId, setSelectedWasteBasketId] = useState('');
  const mapIframeRef = useRef<HTMLIFrameElement>(null);

  // NEW: Karte form state
  const [karteFormData, setKarteFormData] = useState({
    address: '',
    wasteBinId: '',
    partnerCity: 'nuernberg',
    photo: null,
    problemType: '',
    additionalInfo: ''
  });
  
  const inputRef = useRef(null);
  const { toast } = useToast();
  const { user, logout, isLoggedIn } = useAuth();

  // Use the statistics hook
  const { statistics, loading: statsLoading } = useStatistics();
  const { submitReport, submitNotificationRequest, isSubmitting } = useBinReports();

  // Partner municipalities list
  const partnerMunicipalities = [
    { value: 'nuernberg', label: 'Nürnberg' },
    { value: 'erlangen', label: 'Erlangen' },
    { value: 'fuerth', label: 'Fürth' }
  ];

  // Setup iframe communication for map interaction
  useEffect(() => {
    const handleMapMessage = (event: MessageEvent) => {
      // Only accept messages from the trusted map origin
      if (event.origin !== 'https://routenplanung.vercel.app') return;
      
      console.log('Received map message:', event.data);
      
      if (event.data.type === 'wasteBasketSelected') {
        console.log('Waste basket selected:', event.data.id);
        setKarteFormData(prev => ({ ...prev, wasteBinId: event.data.id }));
        toast({
          title: "Mülleimer ausgewählt",
          description: `WasteBasket ID: ${event.data.id}`,
        });
      }
    };

    window.addEventListener('message', handleMapMessage);
    return () => window.removeEventListener('message', handleMapMessage);
  }, [toast]);

  // Send address to map for navigation
  const sendAddressToMap = (address: string) => {
    if (mapIframeRef.current && address.trim()) {
      console.log('Sending address to map:', address);
      mapIframeRef.current.contentWindow?.postMessage({
        type: 'navigateToAddress',
        address: address
      }, 'https://routenplanung.vercel.app');
    }
  };

  // Handle GPS location
  const handleGetGPSLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS nicht verfügbar",
        description: "Ihr Browser unterstützt keine GPS-Ortung.",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use reverse geocoding to get address from coordinates
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=YOUR_MAPBOX_TOKEN&types=address&limit=1`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.features && data.features.length > 0) {
              const address = data.features[0].place_name;
              setKarteFormData(prev => ({ ...prev, address }));
              sendAddressToMap(address);
            }
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          setKarteFormData(prev => ({ 
            ...prev, 
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` 
          }));
        }
        
        setIsGettingLocation(false);
        toast({
          title: "Standort gefunden",
          description: "Ihr aktueller Standort wurde ermittelt.",
        });
      },
      (error) => {
        setIsGettingLocation(false);
        toast({
          title: "GPS-Fehler",
          description: "Standort konnte nicht ermittelt werden.",
          variant: "destructive",
        });
      }
    );
  };

  // Handle address input and navigation
  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (karteFormData.address.trim()) {
      sendAddressToMap(karteFormData.address);
      toast({
        title: "Navigation gestartet",
        description: `Navigiere zu: ${karteFormData.address}`,
      });
    }
  };

  // Handle photo upload for Karte form
  const handleKartePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setKarteFormData(prev => ({ ...prev, photo: file }));
      toast({
        title: "Foto hochgeladen!",
        description: "Ihr Bild wurde zur Meldung hinzugefügt.",
      });
    }
  };

  // Handle Karte form submission
  const handleKarteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!karteFormData.wasteBinId) {
      toast({
        title: "Mülleimer auswählen",
        description: "Bitte wählen Sie zuerst einen Mülleimer auf der Karte aus.",
        variant: "destructive",
      });
      return;
    }
    
    if (!karteFormData.problemType) {
      toast({
        title: "Problem-Art auswählen",
        description: "Bitte wählen Sie eine Problem-Art aus.",
        variant: "destructive",
      });
      return;
    }

    const reportId = await submitReport({
      location: karteFormData.address || `Mülleimer ${karteFormData.wasteBinId}`,
      issue_type: karteFormData.problemType,
      comment: karteFormData.additionalInfo?.trim() || null,
      photo: karteFormData.photo,
      partner_municipality: karteFormData.partnerCity
    });

    if (reportId) {
      setCurrentReportId(reportId);
      setCurrentView('confirmation');
      setKarteFormData({
        address: '',
        wasteBinId: '',
        partnerCity: 'nuernberg',
        photo: null,
        problemType: '',
        additionalInfo: ''
      });
      toast({
        title: "Meldung erfolgreich!",
        description: "Ihre Meldung wurde an die Stadtreinigung weitergeleitet.",
      });
    }
  };

  const renderHeader = () => (
    <header className="bg-white shadow-sm border-b border-green-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between w-full min-h-[48px]">
          {/* Logo - Fixed width to prevent shifting */}
          <div className="flex items-center space-x-2 cursor-pointer w-48 flex-shrink-0" onClick={() => setCurrentView('home')}>
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-green-800 whitespace-nowrap">CleanCity</h1>
          </div>

          {/* Desktop Navigation - Centered with fixed spacing */}
          <nav className="hidden md:flex items-center justify-center flex-1 max-w-2xl mx-auto">
            <div className="flex items-center space-x-6">
              <Button 
                onClick={() => setCurrentView('report')}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-semibold shadow-md transform transition hover:scale-105"
              >
                Mülleimer melden
              </Button>
              {isLoggedIn && (
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentView('karte')}
                  className={`px-4 py-2 rounded-md transition-colors whitespace-nowrap min-w-[100px] ${
                    currentView === 'karte' 
                      ? 'text-green-600 bg-green-50 font-semibold' 
                      : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                  }`}
                >
                  Karte
                </Button>
              )}
              <Button 
                variant="ghost" 
                onClick={() => setCurrentView('home')}
                className={`px-4 py-2 rounded-md transition-colors whitespace-nowrap min-w-[100px] ${
                  currentView === 'home' 
                    ? 'text-green-600 bg-green-50 font-semibold' 
                    : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                Startseite
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setCurrentView('products')}
                className={`px-4 py-2 rounded-md transition-colors whitespace-nowrap min-w-[100px] ${
                  currentView === 'products' 
                    ? 'text-green-600 bg-green-50 font-semibold' 
                    : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                Produkte
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setCurrentView('about')}
                className={`px-4 py-2 rounded-md transition-colors whitespace-nowrap min-w-[100px] ${
                  currentView === 'about' 
                    ? 'text-green-600 bg-green-50 font-semibold' 
                    : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                Über uns
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setCurrentView('info')}
                className={`px-4 py-2 rounded-md transition-colors whitespace-nowrap min-w-[100px] ${
                  currentView === 'info' 
                    ? 'text-green-600 bg-green-50 font-semibold' 
                    : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                Informationen
              </Button>
            </div>
          </nav>

          {/* User Authentication - Fixed width to prevent shifting */}
          <div className="hidden md:flex items-center justify-end w-48 flex-shrink-0">
            {isLoggedIn ? (
              <div className="flex items-center space-x-3">
                {/* User Profile Widget - Removed "Hallo," text */}
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <User className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">{user?.username}!</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Abmelden
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAuthModal(true)}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Anmelden
              </Button>
            )}
          </div>

          {/* Mobile Menu Button - Fixed right position */}
          <div className="md:hidden flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 w-10 h-10"
            >
              {showMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {showMenu && (
          <div className="md:hidden bg-white border-t border-green-100 px-4 py-2 shadow-lg mt-4">
            <Button 
              className="w-full bg-green-500 hover:bg-green-600 text-white mb-4 py-3 rounded-md font-semibold"
              onClick={() => { setCurrentView('report'); setShowMenu(false); }}
            >
              Mülleimer melden
            </Button>
            {isLoggedIn && (
              <Button 
                variant="ghost" 
                className={`w-full justify-start mb-2 px-4 py-3 rounded-md transition-colors ${
                  currentView === 'karte' 
                    ? 'text-green-600 bg-green-50 font-semibold' 
                    : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
                onClick={() => { setCurrentView('karte'); setShowMenu(false); }}
              >
                Karte
              </Button>
            )}
            <Button 
              variant="ghost" 
              className={`w-full justify-start mb-2 px-4 py-3 rounded-md transition-colors ${
                currentView === 'home' 
                  ? 'text-green-600 bg-green-50 font-semibold' 
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
              onClick={() => { setCurrentView('home'); setShowMenu(false); }}
            >
              Startseite
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full justify-start mb-2 px-4 py-3 rounded-md transition-colors ${
                currentView === 'products' 
                  ? 'text-green-600 bg-green-50 font-semibold' 
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
              onClick={() => { setCurrentView('products'); setShowMenu(false); }}
            >
              Produkte
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full justify-start mb-2 px-4 py-3 rounded-md transition-colors ${
                currentView === 'about' 
                  ? 'text-green-600 bg-green-50 font-semibold' 
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
              onClick={() => { setCurrentView('about'); setShowMenu(false); }}
            >
              Über uns
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full justify-start mb-4 px-4 py-3 rounded-md transition-colors ${
                currentView === 'info' 
                  ? 'text-green-600 bg-green-50 font-semibold' 
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
              onClick={() => { setCurrentView('info'); setShowMenu(false); }}
            >
              Informationen
            </Button>
            
            {/* Mobile User Menu */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              {isLoggedIn ? (
                <div className="space-y-2">
                  {/* Mobile User Profile Widget - Removed "Hallo," text */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <User className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">{user?.username}!</span>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-800 hover:bg-red-50"
                    onClick={() => { handleLogout(); setShowMenu(false); }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Abmelden
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-green-600 hover:text-green-800 hover:bg-green-50"
                  onClick={() => { setShowAuthModal(true); setShowMenu(false); }}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Anmelden
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );

  // Updated Karte view with complete form layout
  const renderKarte = () => (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-green-800">
          🗺️ Interaktive Mülleimer-Karte Nürnberg
        </h1>
        
        <Card className="bg-white shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleKarteSubmit} className="space-y-6">
              
              {/* 1. Address Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📍 Adresse
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={karteFormData.address}
                    onChange={(e) => setKarteFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Adresse eingeben..."
                    className="flex-1"
                  />
                  <Button 
                    type="button"
                    onClick={handleGetGPSLocation}
                    disabled={isGettingLocation}
                    variant="outline"
                    className="px-4"
                  >
                    {isGettingLocation ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                    ) : (
                      <Navigation className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* 2. Interactive Map */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🗺️ Karte
                </label>
                <iframe 
                  ref={mapIframeRef}
                  id="map-iframe"
                  src="https://routenplanung.vercel.app/nbg_wastebaskets_map.html"
                  className="w-full h-[500px] border rounded-lg shadow-sm"
                  title="Interaktive Mülleimer Karte"
                />
              </div>

              {/* 3. Selected Waste Basket */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🗑️ Ausgewählte Mülleimer ID:
                </label>
                <Input
                  type="text"
                  value={karteFormData.wasteBinId || 'Kein Mülleimer ausgewählt'}
                  readOnly
                  className="bg-gray-100"
                />
              </div>

              {/* 4. Partner Stadtverwaltung */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏛️ Partner Stadtverwaltung:
                </label>
                <Select 
                  value={karteFormData.partnerCity} 
                  onValueChange={(value) => setKarteFormData(prev => ({ ...prev, partnerCity: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Stadt auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nuernberg">Nürnberg</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 5. Foto Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📷 Foto (optional):
                </label>
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleKartePhotoUpload}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                {karteFormData.photo && (
                  <p className="text-xs text-green-600 mt-1">Foto hochgeladen: {karteFormData.photo.name}</p>
                )}
              </div>

              {/* 6. Problem Art */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⚠️ Problem Art: <span className="text-red-500">*</span>
                </label>
                <Select 
                  value={karteFormData.problemType} 
                  onValueChange={(value) => setKarteFormData(prev => ({ ...prev, problemType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Problem auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overfilled">Überfüllt</SelectItem>
                    <SelectItem value="broken">Beschädigt</SelectItem>
                    <SelectItem value="vandalized">Vandalismus</SelectItem>
                    <SelectItem value="smelly">Stinkt</SelectItem>
                    <SelectItem value="missing">Fehlt komplett</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 7. Zusätzliche Informationen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Zusätzliche Informationen (optional):
                </label>
                <Textarea
                  value={karteFormData.additionalInfo}
                  onChange={(e) => setKarteFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                  placeholder="Beschreiben Sie das Problem genauer..."
                  rows={3}
                />
              </div>

              {/* 8. Submit Button */}
              <Button
                type="submit"
                disabled={!karteFormData.wasteBinId || !karteFormData.problemType || isSubmitting}
                className={`w-full py-3 text-lg font-semibold ${
                  karteFormData.wasteBinId && karteFormData.problemType
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Wird gesendet...
                  </div>
                ) : (
                  'Mülleimer melden'
                )}
              </Button>
            </form>

            {/* Instructions */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">💡 So funktioniert's:</h3>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Geben Sie eine Adresse ein oder nutzen Sie den GPS-Button</li>
                <li>Klicken Sie auf einen Mülleimer-Marker in der Karte</li>
                <li>Wählen Sie die Problem-Art aus</li>
                <li>Klicken Sie "Mülleimer melden"</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {renderHeader()}
      
      <div className="container mx-auto px-4 py-16 text-center max-w-2xl">
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h2 className="text-3xl font-bold text-green-800 mb-4">
            Vielen Dank!
          </h2>
          
          <p className="text-lg text-gray-600 mb-8">
            Ihre Meldung wurde erfolgreich übermittelt. Die Stadtreinigung wird schnellstmöglich reagieren.
          </p>

          <div className="space-y-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">
                🔔 Benachrichtigungen erhalten?
              </h3>
              <p className="text-sm text-blue-600 mb-3">
                Möchten Sie informiert werden, wenn dieser Mülleimer geleert wurde?
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowNotificationDialog(true)}
              >
                Ja, benachrichtigen
              </Button>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">
                📢 CleanCity weiterempfehlen
              </h3>
              <p className="text-sm text-green-600 mb-3">
                Erzählen Sie anderen von CleanCity!
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                App teilen
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => setCurrentView('report')}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              Weiteren Mülleimer melden
            </Button>
            <Button
              onClick={() => setCurrentView('home')}
              variant="outline"
              className="w-full"
            >
              Zur Startseite
            </Button>
          </div>
        </div>
      </div>

      <NotificationDialog
        isOpen={showNotificationDialog}
        onClose={() => setShowNotificationDialog(false)}
        onSubmit={handleNotificationRequest}
      />
    </div>
  );

  const renderAbout = () => (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h2 className="text-3xl font-bold text-green-800 mb-8">Über uns</h2>
        
        <div className="grid md:grid-cols-1 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Leaf className="w-5 h-5 mr-2 text-green-600" />
                Unsere Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                CleanCity ist eine innovative Bürgerplattform, die es jedem ermöglicht, aktiv zur Sauberkeit und Lebensqualität unserer Stadt beizutragen. Unser Ziel ist es, die Kommunikation zwischen Bürgern und Stadtverwaltung zu vereinfachen und zu beschleunigen.
              </p>
              <p className="text-gray-600">
                Durch die einfache Meldung von überfüllten oder beschädigten Mülleimern helfen Sie dabei, unsere Stadt noch sauberer und lebenswerter zu machen. Jede Meldung zählt und trägt zu einem besseren Zusammenleben bei.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Unser Team</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                CleanCity wurde in enger Zusammenarbeit mit der Stadtverwaltung und lokalen Bürgerinitiativen entwickelt. Unser Team besteht aus:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Stadtplanungsexperten</li>
                <li>Softwareentwicklern</li>
                <li>UX/UI-Designern</li>
                <li>Umweltschutzbeauftragten</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kontakt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-green-600" />
                  <span>+49 (0) 123 456 789</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Info className="w-5 h-5 text-green-600" />
                  <span>info@cleancity.de</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <span>Rathaus, Hauptstraße 1, 12345 Musterstadt</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderInfo = () => (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h2 className="text-3xl font-bold text-green-800 mb-8">Informationen</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="w-5 h-5 mr-2" />
                Häufige Fragen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">Wie funktioniert CleanCity?</h4>
                <p className="text-sm text-gray-600">
                  Sie melden problematische Mülleimer, die Stadtreinigung erhält automatisch eine Benachrichtigung und kümmert sich um die Behebung.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Was passiert mit meinen Meldungen?</h4>
                <p className="text-sm text-gray-600">
                  Alle Meldungen werden direkt an die zuständige Abteilung weitergeleitet und in der Regel innerhalb von 24-48 Stunden bearbeitet.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Werden meine Daten gespeichert?</h4>
                <p className="text-sm text-gray-600">
                  Nein, die App funktioniert vollständig anonymous. Es werden keine persönlichen Daten gespeichert oder weitergegeben.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Legal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Rechtliches
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setCurrentView('datenschutz')}
              >
                Datenschutzerklärung
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setCurrentView('impressum')}
              >
                Impressum
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setCurrentView('nutzungsbedingungen')}
              >
                Nutzungsbedingungen
              </Button>
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="w-4 h-4 mr-2" />
                  Stadtverwaltung kontaktieren
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* App Download */}
          <Card>
            <CardHeader>
              <CardTitle>Mobile Apps</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                CleanCity bald auch als native App verfügbar:
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" disabled>
                  📱 Im App Store (demnächst)
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  🤖 Bei Google Play (demnächst)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Version Info */}
          <Card>
            <CardHeader>
              <CardTitle>App-Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span>1.0.0 Beta</span>
                </div>
                <div className="flex justify-between">
                  <span>Letztes Update:</span>
                  <span>Dezember 2024</span>
                </div>
                <div className="flex justify-between">
                  <span>Entwickelt für:</span>
                  <span>Stadtverwaltung</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderDatenschutz = () => (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Datenschutzerklärung für CleanCity</CardTitle>
            <p className="text-gray-600">Stand: Dezember 2024</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Verantwortlicher</h2>
              <p className="text-gray-700">
                Verantwortlich für die Datenverarbeitung ist:<br/>
                Stadtverwaltung Musterstadt<br/>
                Hauptstraße 1<br/>
                12345 Musterstadt<br/>
                E-Mail: datenschutz@musterstadt.de<br/>
                Telefon: +49 (0) 123 456 789
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Erhebung und Verarbeitung personenbezogener Daten</h2>
              <p className="text-gray-700 mb-3">
                Bei der Nutzung von CleanCity werden folgende Daten verarbeitet:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Standortdaten (GPS-Koordinaten) zur Identifizierung der gemeldeten Mülleimer</li>
                <li>Hochgeladene Fotos zur Dokumentation des Problems</li>
                <li>Technische Daten wie IP-Adresse und Browser-Informationen</li>
                <li>Zeitstempel der Meldungen</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Zweck der Datenverarbeitung</h2>
              <p className="text-gray-700">
                Die erhobenen Daten werden ausschließlich zur Bearbeitung Ihrer Meldungen über problematische Mülleimer verwendet. Die Standortdaten ermöglichen es der Stadtreinigung, den gemeldeten Mülleimer zu finden und das Problem zu beheben.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Rechtsgrundlage</h2>
              <p className="text-gray-700">
                Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. e DSGVO (Wahrnehmung einer Aufgabe im öffentlichen Interesse) zur Gewährleistung der Stadtsauberkeit.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Speicherdauer</h2>
              <p className="text-gray-700">
                Die Daten werden nur so lange gespeichert, wie es für die Bearbeitung der Meldung erforderlich ist. Nach Behebung des Problems werden die Daten binnen 30 Tagen gelöscht.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Ihre Rechte</h2>
              <p className="text-gray-700 mb-3">
                Sie haben folgende Rechte bezüglich Ihrer personenbezogener Daten:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
                <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
                <li>Recht auf Löschung (Art. 17 DSGVO)</li>
                <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                <li>Recht auf Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Kontakt</h2>
              <p className="text-gray-700">
                Bei Fragen zum Datenschutz wenden Sie sich bitte an unseren Datenschutzbeauftragten unter datenschutz@musterstadt.de.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderImpressum = () => (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Impressum</CardTitle>
            <p className="text-gray-600">Angaben gemäß § 5 TMG</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">Anbieter</h2>
              <div className="text-gray-700">
                <p><strong>Stadtverwaltung Musterstadt</strong></p>
                <p>Hauptstraße 1</p>
                <p>12345 Musterstadt</p>
                <p>Deutschland</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Kontakt</h2>
              <div className="text-gray-700">
                <p><strong>Telefon:</strong> +49 (0) 123 456 789</p>
                <p><strong>Fax:</strong> +49 (0) 123 456 790</p>
                <p><strong>E-Mail:</strong> info@musterstadt.de</p>
                <p><strong>Website:</strong> www.musterstadt.de</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Vertretungsberechtigte</h2>
              <div className="text-gray-700">
                <p><strong>Bürgermeister:</strong> Max Mustermann</p>
                <p><strong>Stellvertretung:</strong> Maria Musterfrau</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Umsatzsteuer-Identifikationsnummer</h2>
              <p className="text-gray-700">
                Gemäß § 27a Umsatzsteuergesetz: DE123456789
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Aufsichtsbehörde</h2>
              <div className="text-gray-700">
                <p>Regierungspräsidium Musterland</p>
                <p>Kommunalaufsicht</p>
                <p>Behördenstraße 10</p>
                <p>12345 Musterland</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Verantwortlich für den Inhalt</h2>
              <div className="text-gray-700">
                <p>Nach § 55 Abs. 2 RStV:</p>
                <p><strong>Dr. Sarah Schmidt</strong></p>
                <p>Leiterin Öffentlichkeitsarbeit</p>
                <p>Stadtverwaltung Musterstadt</p>
                <p>Hauptstraße 1</p>
                <p>12345 Musterstadt</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Haftungsausschluss</h2>
              <div className="text-gray-700 space-y-3">
                <div>
                  <h3 className="font-semibold">Inhalt des Onlineangebotes</h3>
                  <p>Die Stadtverwaltung übernimmt keinerlei Gewähr für die Aktualität, Korrektheit, Vollständigkeit oder Qualität der bereitgestellten Informationen.</p>
                </div>
                <div>
                  <h3 className="font-semibold">Verweise und Links</h3>
                  <p>Bei direkten oder indirekten Verweisen auf fremde Webseiten, die außerhalb des Verantwortungsbereiches liegen, würde eine Haftung für Schäden, die durch die Nutzung der Plattform entstehen, ausgeschlossen.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Urheberrecht</h2>
              <p className="text-gray-700">
                Die durch die Stadtverwaltung erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung der Stadtverwaltung.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderNutzungsbedingungen = () => (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Nutzungsbedingungen für CleanCity</CardTitle>
            <p className="text-gray-600">Stand: Dezember 2024</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Geltungsbereich</h2>
              <p className="text-gray-700">
                Diese Nutzungsbedingungen gelten für die Nutzung der CleanCity-Plattform, die von der Stadtverwaltung Musterstadt betrieben wird. Mit der Nutzung der Plattform erkennen Sie diese Bedingungen an.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Zweck der Plattform</h2>
              <p className="text-gray-700">
                CleanCity dient der Meldung von überfüllten oder beschädigten Mülleimern im Stadtgebiet. Die Plattform ermöglicht eine direkte Kommunikation zwischen Bürgern und der Stadtreinigung.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Nutzerverhalten</h2>
              <p className="text-gray-700 mb-3">
                Bei der Nutzung von CleanCity verpflichten Sie sich:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Nur wahrheitsgemäße Meldungen abzugeben</li>
                <li>Keine missbräuchlichen oder falschen Meldungen zu erstellen</li>
                <li>Keine beleidigenden oder diskriminierenden Inhalte zu veröffentlichen</li>
                <li>Die Privatsphäre anderer zu respektieren</li>
                <li>Keine urheberrechtlich geschützten Inhalte ohne Erlaubnis hochzuladen</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Meldungen und Fotos</h2>
              <p className="text-gray-700">
                Hochgeladene Fotos sollten ausschließlich den gemeldeten Mülleimer und dessen unmittelbare Umgebung zeigen. Personen sollten nicht erkennbar fotografiert werden. Die Stadtverwaltung behält sich vor, ungeeignete Inhalte zu entfernen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Haftungsausschluss</h2>
              <p className="text-gray-700">
                Die Stadtverwaltung übernimmt keine Gewähr für die Vollständigkeit, Richtigkeit oder Aktualität der über CleanCity bereitgestellten Informationen. Eine Haftung für Schäden, die durch die Nutzung der Plattform entstehen, ist ausgeschlossen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Bearbeitungszeiten</h2>
              <p className="text-gray-700">
                Die Stadtverwaltung bemüht sich, gemeldete Probleme schnellstmöglich zu bearbeiten. Eine Garantie für bestimmte Bearbeitungszeiten kann jedoch nicht gegeben werden.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Änderungen der Nutzungsbedingungen</h2>
              <p className="text-gray-700">
                Die Stadtverwaltung behält sich vor, diese Nutzungsbedingungen jederzeit zu ändern. Nutzer werden über wesentliche Änderungen informiert.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Kontakt</h2>
              <p className="text-gray-700">
                Bei Fragen zu diesen Nutzungsbedingungen wenden Sie sich bitte an: info@musterstadt.de
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Main render logic
  return (
    <>
      {/* Main Content */}
      {(() => {
        switch (currentView) {
          case 'report':
            return renderReportForm();
          case 'confirmation':
            return renderConfirmation();
          case 'karte':
            return isLoggedIn ? renderKarte() : renderHome();
          case 'products':
            return renderProducts();
          case 'about':
            return renderAbout();
          case 'info':
            return renderInfo();
          case 'datenschutz':
            return renderDatenschutz();
          case 'impressum':
            return renderImpressum();
          case 'nutzungsbedingungen':
            return renderNutzungsbedingungen();
          default:
            return renderHome();
        }
      })()}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Notification Dialog */}
      <NotificationDialog
        isOpen={showNotificationDialog}
        onClose={() => setShowNotificationDialog(false)}
        onSubmit={handleNotificationRequest}
      />
    </>
  );
};

export default Index;
