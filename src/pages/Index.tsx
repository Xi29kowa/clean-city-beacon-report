import React, { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, Leaf, CheckCircle, ArrowRight, Upload, Menu, X, Info, Shield, Phone, User, LogIn, Share2, Copy, Wifi, Battery, Zap, Database, Monitor, LogOut, Navigation, Trash2 } from 'lucide-react';
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
import ProblemTypeSelect from "@/components/ProblemTypeSelect";
import InteractiveMap from "@/components/InteractiveMap";
import { useNavigate } from 'react-router-dom';

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
  
  const inputRef = useRef(null);
  const { toast } = useToast();
  const { user, logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Use the statistics hook
  const { statistics, loading: statsLoading } = useStatistics();
  const { submitReport, submitNotificationRequest, isSubmitting } = useBinReports();

  // Partner municipalities list
  const partnerMunicipalities = [
    { value: 'nuernberg', label: 'Nürnberg' },
    { value: 'erlangen', label: 'Erlangen' },
    { value: 'fuerth', label: 'Fürth' }
  ];

  // Handle waste basket selection from map
  const handleWasteBasketSelect = (binId: string) => {
    console.log('Waste basket selected:', binId);
    setSelectedWasteBasketId(binId);
    setSelectedWasteBasket(binId);
    toast({
      title: "Mülleimer ausgewählt",
      description: `WasteBasket ID: ${binId}`,
    });
  };

  // Handle "Mülleimer melden" button click
  const handleReportWasteBasket = () => {
    if (selectedWasteBasketId) {
      // Pre-fill the form with the selected waste basket
      setFormData(prev => ({ 
        ...prev, 
        wasteBinId: selectedWasteBasketId,
        location: `Standort Mülleimer ${selectedWasteBasketId}`
      }));
      setCurrentView('report');
      toast({
        title: "Formular vorbereitet",
        description: `Mülleimer ${selectedWasteBasketId} für Meldung ausgewählt`,
      });
    }
  };

  // Handle GPS location request
  const handleGetCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "GPS nicht verfügbar",
        description: "Ihr Browser unterstützt keine Geolocation.",
        variant: "destructive",
      });
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationCoordinates({ lat: latitude, lng: longitude });
        
        // Reverse geocode to get address
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`)
          .then(response => response.json())
          .then(data => {
            if (data.display_name) {
              const parts = data.display_name.split(',');
              const address = parts.slice(0, 3).join(', ').trim();
              setMapAddress(address);
            }
          })
          .catch(error => {
            console.error('Reverse geocoding error:', error);
            setMapAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          })
          .finally(() => {
            setIsGettingLocation(false);
          });
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "Standort nicht verfügbar",
          description: "Der Standort konnte nicht ermittelt werden.",
          variant: "destructive",
        });
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Check if report can be submitted based on partner municipality
  useEffect(() => {
    const hasIssueType = formData.issueType;
    
    // Only require issue type - location and partner municipality are now optional
    setCanSubmitReport(Boolean(hasIssueType));
  }, [formData.issueType]);

  // Animation function for counter
  const animateCounter = (start, end, duration = 1000) => {
    const startTime = Date.now();
    const range = end - start;
    
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + range * easeOut);
      
      setDisplayCount(current);
      
      if (progress === 1) {
        clearInterval(timer);
      }
    }, 16); // ~60fps
  };

  // Update counter when statistics change
  useEffect(() => {
    if (!statsLoading && displayCount !== statistics.total_reports) {
      animateCounter(displayCount, statistics.total_reports);
    }
  }, [statistics.total_reports, statsLoading]);

  // Clean town and city images for slideshow - using uploaded images
  const cityImages = [
    '/lovable-uploads/6d72ae02-350d-4772-97a8-7c4277724471.png',
    '/lovable-uploads/2ef5a94a-bbdd-4ab8-928b-2eea2b8f4491.png',
    '/lovable-uploads/0343eb59-7972-47ca-98cc-2877fdd5f59a.png',
    '/lovable-uploads/2b8fbdcc-e881-4cba-838c-9de31ff24223.png',
    '/lovable-uploads/1be0d136-0b07-4c24-b9ef-4a8735691b13.png'
  ];

  // Slideshow effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === cityImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [cityImages.length]);

  const handleLocationChange = (location: string, coordinates?: { lat: number; lng: number }) => {
    setFormData(prev => ({ ...prev, location }));
    if (coordinates) {
      setLocationCoordinates(coordinates);
    }
  };

  const handlePartnerMunicipalityChange = (municipality: string | null) => {
    setFormData(prev => ({ ...prev, partnerMunicipality: municipality || '' }));
  };

  const handleWasteBinSelect = (binId: string, binLocation: string) => {
    console.log('Waste bin selected in Index:', binId, binLocation);
    setFormData(prev => ({ 
      ...prev, 
      wasteBinId: binId,
      location: binLocation || prev.location
    }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, photo: file }));
      toast({
        title: "Foto hochgeladen!",
        description: "Ihr Bild wurde zur Meldung hinzugefügt.",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 CRITICAL - Form submission started with data:', {
      location: formData.location,
      issueType: formData.issueType,
      comment: formData.comment?.trim() || null,
      photo: formData.photo?.name || 'none',
      partnerMunicipality: formData.partnerMunicipality,
      wasteBinId: formData.wasteBinId
    });
    
    if (!formData.issueType) {
      toast({
        title: "Fehlende Angaben", 
        description: "Bitte wählen Sie eine Problemart aus.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('🗑️ CRITICAL - PASSING wasteBinId to submitReport:', formData.wasteBinId);
    
    const reportId = await submitReport({
      location: formData.location?.trim() || 'Nicht angegeben',
      issue_type: formData.issueType,
      comment: formData.comment?.trim() || null,
      photo: formData.photo,
      partner_municipality: formData.partnerMunicipality || null,
      waste_bin_id: formData.wasteBinId // CRITICAL: Pass the waste_bin_id here!
    });

    if (reportId) {
      setCurrentReportId(reportId);
      setCurrentView('confirmation');
      setFormData({ 
        location: '', 
        photo: null, 
        issueType: '', 
        comment: '', 
        partnerMunicipality: '',
        wasteBinId: '' 
      });
      setLocationCoordinates(null);
      toast({
        title: "Meldung erfolgreich!",
        description: "Ihre Meldung wurde an die Stadtreinigung weitergeleitet.",
      });
    } else {
      toast({
        title: "Fehler beim Senden",
        description: "Ihre Meldung konnte nicht übermittelt werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  };

  const handleNotificationRequest = async (email: string) => {
    if (!currentReportId) return false;
    return await submitNotificationRequest(email, currentReportId);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = 'Green Bin - Hilf mit, deine Stadt sauber zu halten!';
    const text = 'Melde überfüllte oder beschädigte Mülleimer mit Green Bin und sorge für eine saubere Stadt.';

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url
        });
      } catch (error) {
        console.log('Share cancelled or failed:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link kopiert!",
          description: "Der Link wurde in die Zwischenablage kopiert.",
        });
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        toast({
          title: "Fehler",
          description: "Der Link konnte nicht kopiert werden.",
          variant: "destructive",
        });
      }
    }
  };

  const handleLogout = () => {
    logout();
    if (currentView === 'karte') {
      setCurrentView('home');
    }
    toast({
      title: "Erfolgreich abgemeldet",
      description: "Auf Wiedersehen!",
    });
  };

  const handleUserAccountClick = () => {
    navigate('/account');
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
            <h1 className="text-xl font-bold text-green-800 whitespace-nowrap">Green Bin</h1>
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
                {/* User Profile Widget - Clickable and without ! */}
                <div 
                  className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={handleUserAccountClick}
                >
                  <User className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">{user?.username}</span>
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
                  {/* Mobile User Profile Widget - Clickable and without ! */}
                  <div 
                    className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                    onClick={() => { handleUserAccountClick(); setShowMenu(false); }}
                  >
                    <User className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">{user?.username}</span>
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

  const renderReportForm = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {renderHeader()}
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-green-800 text-center">
              🗑️ Mülleimer melden
            </CardTitle>
            <p className="text-gray-600 text-center">
              Helfen Sie uns, Ihre Stadt sauber zu halten
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Enhanced Location Picker */}
              <EnhancedLocationPicker
                value={formData.location}
                coordinates={locationCoordinates}
                onChange={handleLocationChange}
                onPartnerMunicipalityChange={handlePartnerMunicipalityChange}
                onWasteBinSelect={handleWasteBinSelect}
                onWasteBinIdChange={(id) => {
                  console.log('🗑️ CRITICAL - Updating wasteBinId in formData to:', id);
                  setFormData(prev => ({ ...prev, wasteBinId: id }));
                }}
                wasteBinId={formData.wasteBinId}
              />

              {/* Problem Type */}
              <ProblemTypeSelect
                value={formData.issueType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, issueType: value }))}
              />

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📸 Foto (optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-gray-600">
                      {formData.photo ? formData.photo.name : 'Foto auswählen'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💬 Zusätzliche Informationen (optional)
                </label>
                <Textarea
                  value={formData.comment}
                  onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Beschreiben Sie das Problem genauer..."
                  className="resize-none"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!canSubmitReport || isSubmitting}
                className={`w-full py-3 text-lg font-semibold ${
                  canSubmitReport && !isSubmitting
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Wird gesendet...' : 'Meldung absenden'}
              </Button>

              {/* Information Box - Updated to reflect new optional requirements */}
              {!formData.partnerMunicipality && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800 font-medium">
                        Hinweis zur Bearbeitung
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        Ohne Angabe einer Partnerstadt kann die Bearbeitung länger dauern. 
                        Für schnellere Bearbeitung wählen Sie eine Partnerstadt aus.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {renderHeader()}
      
      {/* Hero Section with Slideshow */}
      <section className="px-4 py-12 text-center relative overflow-hidden h-96 md:h-[500px]">
        {/* Background Images */}
        {cityImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.3)), url('${image}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              animation: index === currentImageIndex ? 'zoom-in 4s ease-in-out' : 'none',
            }}
          />
        ))}
        
        {/* Content */}
        <div className="container mx-auto max-w-4xl relative z-10 h-full flex flex-col justify-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 drop-shadow-2xl">
            Hilf mit, deine Stadt sauber zu halten!
          </h2>
          <p className="text-lg text-white mb-8 max-w-2xl mx-auto drop-shadow-lg">
            Melde überfüllte oder beschädigte Mülleimer schnell und einfach. 
            Gemeinsam sorgen wir für eine saubere und lebenswerte Stadt.
          </p>
          <Button 
            onClick={() => setCurrentView('report')}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 text-lg rounded-full shadow-lg transform transition hover:scale-105 font-semibold mx-auto"
          >
            Mülleimer melden <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-12 bg-white">
        <div className="container mx-auto max-w-4xl">
          <h3 className="text-2xl font-bold text-center text-gray-800 mb-12">
            So funktioniert's – in nur 3 Schritten
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-semibold mb-2">1. Mülleimer melden</h4>
              <p className="text-gray-600">Klicke auf „Mülleimer melden", um den Vorgang zu starten.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">2. Standort wählen</h4>
              <p className="text-gray-600">Wähle auf der Karte den Mülleimer aus und gib die ID ins Feld ein.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">3. Grund auswählen & senden</h4>
              <p className="text-gray-600">Wähle den Meldegrund aus und schicke die Meldung ab – fertig!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Counter with Animation */}
      <section className="px-4 py-12 bg-green-50">
        <div className="container mx-auto max-w-2xl text-center">
          <h3 className="text-2xl font-bold text-green-800 mb-4">Unser gemeinsamer Erfolg</h3>
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <div className="text-4xl font-bold text-green-600 mb-2 transition-all duration-300">
              {statsLoading ? '...' : displayCount.toLocaleString('de-DE')}
            </div>
            <p className="text-gray-600">Mülleimer bereits gemeldet</p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-semibold text-blue-600">
                  {statsLoading ? '...' : statistics.processed_reports.toLocaleString('de-DE')}
                </div>
                <div className="text-gray-500">Bereits bearbeitet</div>
              </div>
              <div>
                <div className="font-semibold text-orange-600">
                  {statsLoading ? '...' : statistics.in_progress_reports.toLocaleString('de-DE')}
                </div>
                <div className="text-gray-500">In Bearbeitung</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  const renderProducts = () => (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      
      {/* Hero Section */}
      <section className="px-4 py-16 bg-gradient-to-br from-blue-600 to-green-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Intelligente Sensorik für eine saubere Stadt
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Automatische Füllstandsmessung für eine effiziente Müllentsorgung.
          </p>
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto">
            <Zap className="w-12 h-12 text-white" />
          </div>
        </div>
      </section>

      {/* Product Highlights */}
      <section className="px-4 py-16 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Produkthighlights
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle>Kompakte Bauweise</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Kleiner Formfaktor - passt in jeden Mülleimer ohne störende Auffälligkeit.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Battery className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle>Batteriebetrieben</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Langlebige Batterien für jahrelangen wartungsfreien Betrieb.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wifi className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle>Drahtlose Übertragung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  NB-IoT oder Wi-Fi Konnektivität für zuverlässige Datenübertragung.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Database className="w-8 h-8 text-orange-600" />
                </div>
                <CardTitle>Backend-Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Direkte Datenübertragung an das Green Bin Backend-System.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Monitor className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle>API-Schnittstelle</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Nahtlose Verbindung zu öffentlichen Service-Dashboards.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-teal-600" />
                </div>
                <CardTitle>Intelligente Sensoren</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Präzise Füllstandsmessung mit fortschrittlicher Sensortechnologie.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="px-4 py-16 bg-green-50">
        <div className="container mx-auto max-w-4xl text-center">
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-10 h-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Pilotprojekt in Nürnberg</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-600 mb-6">
                Sensor bald verfügbar – Green Bin testet aktuell erste Pilotgeräte in Nürnberg.
              </p>
              <p className="text-gray-500 mb-8">
                Unsere intelligenten Sensoren werden in den kommenden Monaten in ausgewählten 
                Stadtteilen getestet, um die Effizienz der Müllentsorgung zu optimieren.
              </p>
              <Button 
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 text-lg rounded-full"
                onClick={() => window.location.href = 'mailto:info@greenbin.de?subject=Interesse an Green Bin Sensoren'}
              >
                Mehr erfahren
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );

  const renderKarte = () => (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-green-800">
          🗺️ Interaktive Mülleimer-Karte
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          {/* Address Search Bar with GPS */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="text"
                value={mapAddress}
                onChange={(e) => setMapAddress(e.target.value)}
                placeholder="Adresse eingeben..."
                className="w-full"
              />
            </div>
            <Button 
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              {isGettingLocation ? 'GPS...' : 'GPS'}
            </Button>
          </div>

          {/* Interactive Map */}
          <div className="w-full h-[600px] rounded-lg overflow-hidden border">
            <InteractiveMap
              center={locationCoordinates}
              onWasteBinSelect={handleWasteBasketSelect}
            />
          </div>

          {/* Selected Waste Basket Info */}
          {selectedWasteBasketId && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-800">
                    🗑️ Mülleimer ausgewählt: {selectedWasteBasketId}
                  </h3>
                  <p className="text-sm text-green-600">
                    Klicken Sie auf "Mülleimer melden" um eine Meldung zu erstellen
                  </p>
                </div>
                <Button
                  onClick={handleReportWasteBasket}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  Mülleimer melden
                </Button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">💡 So funktioniert's:</h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Verwenden Sie die GPS-Funktion oder geben Sie eine Adresse ein</li>
              <li>Klicken Sie auf einen Mülleimer-Marker in der Karte</li>
              <li>Der ausgewählte Mülleimer wird unten angezeigt</li>
              <li>Klicken Sie "Mülleimer melden" um das Meldeformular zu öffnen</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-green-800 mb-8">Über uns</h1>
        
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-green-700">Unsere Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-lg leading-relaxed">
                Green Bin wurde mit dem Ziel gegründet, Städte sauberer und lebenswerter zu machen. 
                Durch innovative Technologie und Bürgerbeteiligung schaffen wir eine effiziente 
                Verbindung zwischen Bürgern und städtischen Dienstleistungen.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-green-700">Was wir tun</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-green-600">🔧 Innovative Lösungen</h3>
                  <p className="text-gray-600">
                    Wir entwickeln smarte Technologien zur Optimierung der städtischen Müllentsorgung.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-green-600">👥 Bürgerbeteiligung</h3>
                  <p className="text-gray-600">
                    Jeder Bürger kann aktiv zur Sauberkeit seiner Stadt beitragen.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-green-600">🌱 Nachhaltigkeit</h3>
                  <p className="text-gray-600">
                    Unsere Lösungen fördern eine nachhaltige und umweltfreundliche Stadtentwicklung.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-green-600">📊 Datenbasiert</h3>
                  <p className="text-gray-600">
                    Durch intelligente Datenanalyse optimieren wir städtische Prozesse kontinuierlich.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-green-700">Unser Team</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-lg leading-relaxed">
                Unser interdisziplinäres Team besteht aus Experten in den Bereichen 
                Stadtplanung, Softwareentwicklung, IoT-Technologie und Umweltwissenschaften. 
                Gemeinsam arbeiten wir daran, die Vision einer sauberen und intelligenten 
                Stadt zu verwirklichen.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-green-700">Kontakt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-gray-700">+49 (0) 911 123 456</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-gray-700">Musterstraße 123, 90402 Nürnberg</span>
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
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-green-800 mb-8">Informationen</h1>
        
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-green-700">Häufig gestellte Fragen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-green-600">Wie funktioniert die Meldung?</h3>
                  <p className="text-gray-600">
                    Einfach Standort angeben, Problem auswählen, optional ein Foto hinzufügen und absenden. 
                    Die Meldung wird automatisch an die zuständige Stadtreinigung weitergeleitet.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-green-600">Welche Städte werden unterstützt?</h3>
                  <p className="text-gray-600">
                    Aktuell unterstützen wir Nürnberg, Erlangen und Fürth. 
                    Die Erweiterung auf weitere Städte ist geplant.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-green-600">Wie schnell wird meine Meldung bearbeitet?</h3>
                  <p className="text-gray-600">
                    Die Bearbeitung erfolgt in der Regel innerhalb von 24-48 Stunden, 
                    je nach Priorität und Arbeitsaufkommen der Stadtreinigung.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-green-600">Kostet die Nutzung etwas?</h3>
                  <p className="text-gray-600">
                    Nein, Green Bin ist für alle Bürger kostenlos nutzbar. 
                    Es handelt sich um einen öffentlichen Service zur Verbesserung der Stadtqualität.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-green-700">Technische Informationen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-green-600">Datenschutz</h3>
                  <p className="text-gray-600">
                    Alle Daten werden verschlüsselt übertragen und nur für die Bearbeitung 
                    der Meldungen verwendet. Weitere Details finden Sie in unserer Datenschutzerklärung.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-green-600">GPS-Genauigkeit</h3>
                  <p className="text-gray-600">
                    Für optimale Ergebnisse aktivieren Sie die GPS-Funktion Ihres Geräts. 
                    Die Standortdaten helfen bei der präzisen Zuordnung der Meldungen.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-green-600">Browser-Kompatibilität</h3>
                  <p className="text-gray-600">
                    Green Bin funktioniert mit allen modernen Browsern und ist für 
                    Desktop und mobile Geräte optimiert.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-green-700">Rechtliche Hinweise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentView('datenschutz')}
                  className="w-full justify-start text-green-600 border-green-200 hover:bg-green-50"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Datenschutzerklärung
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentView('impressum')}
                  className="w-full justify-start text-green-600 border-green-200 hover:bg-green-50"
                >
                  <Info className="w-4 h-4 mr-2" />
                  Impressum
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentView('nutzungsbedingungen')}
                  className="w-full justify-start text-green-600 border-green-200 hover:bg-green-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Nutzungsbedingungen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {renderHeader()}
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="bg-white shadow-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">
              Meldung erfolgreich übermittelt!
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Vielen Dank für Ihren Beitrag zu einer sauberen Stadt.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Was passiert als Nächstes?</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Ihre Meldung wurde an die zuständige Stadtreinigung weitergeleitet</li>
                <li>• Die Bearbeitung erfolgt normalerweise innerhalb von 24-48 Stunden</li>
                <li>• Sie können den Status in Ihrem Benutzerkonto verfolgen</li>
              </ul>
            </div>
            
            {currentReportId && (
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-3">
                  Meldungs-ID: {currentReportId}
                </p>
                <Button
                  onClick={() => setShowNotificationDialog(true)}
                  variant="outline"
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  Benachrichtigung bei Bearbeitung erhalten
                </Button>
              </div>
            )}
            
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={() => setCurrentView('report')}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                Weitere Meldung
              </Button>
              <Button 
                onClick={() => setCurrentView('home')}
                variant="outline"
                className="flex-1"
              >
                Zur Startseite
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderDatenschutz = () => (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-green-800 mb-8">Datenschutzerklärung</h1>
        
        <Card>
          <CardContent className="p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">1. Datenschutz auf einen Blick</h2>
              <p className="text-gray-600 leading-relaxed">
                Diese Datenschutzerklärung klärt Sie über die Art, den Umfang und Zweck der Verarbeitung 
                von personenbezogenen Daten innerhalb unseres Onlineangebotes und der mit ihm verbundenen 
                Webseiten, Funktionen und Inhalte auf.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">2. Erhebung und Speicherung personenbezogener Daten</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Wir erheben und verwenden Ihre personenbezogenen Daten nur, soweit dies zur Erbringung 
                einer funktionsfähigen Website sowie unserer Inhalte und Leistungen erforderlich ist.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Standortdaten für die präzise Zuordnung von Meldungen</li>
                <li>Kontaktdaten für die Bearbeitung Ihrer Anfragen</li>
                <li>Technische Daten für die Bereitstellung unserer Services</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">3. Verwendung von Cookies</h2>
              <p className="text-gray-600 leading-relaxed">
                Unsere Website verwendet Cookies, um die Benutzerfreundlichkeit zu verbessern. 
                Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies informiert werden.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">4. Ihre Rechte</h2>
              <p className="text-gray-600 leading-relaxed">
                Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung 
                Ihrer personenbezogenen Daten sowie ein Widerspruchsrecht gegen die Verarbeitung.
              </p>
            </div>

            <div className="border-t pt-6">
              <p className="text-sm text-gray-500">
                Stand: Juni 2024 | Bei Fragen zum Datenschutz kontaktieren Sie uns unter: 
                <a href="mailto:datenschutz@greenbin.de" className="text-green-600 hover:underline">
                  datenschutz@greenbin.de
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderImpressum = () => (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-green-800 mb-8">Impressum</h1>
        
        <Card>
          <CardContent className="p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Angaben gemäß § 5 TMG</h2>
              <div className="text-gray-600 space-y-2">
                <p><strong>Green Bin GmbH</strong></p>
                <p>Musterstraße 123</p>
                <p>90402 Nürnberg</p>
                <p>Deutschland</p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Kontakt</h2>
              <div className="text-gray-600 space-y-2">
                <p>Telefon: +49 (0) 911 123 456</p>
                <p>E-Mail: info@greenbin.de</p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Registerangaben</h2>
              <div className="text-gray-600 space-y-2">
                <p>Registergericht: Amtsgericht Nürnberg</p>
                <p>Registernummer: HRB 12345</p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Geschäftsführung</h2>
              <div className="text-gray-600">
                <p>Max Mustermann</p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Umsatzsteuer-ID</h2>
              <div className="text-gray-600">
                <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: DE123456789</p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Haftungsausschluss</h2>
              <p className="text-gray-600 leading-relaxed">
                Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, 
                Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderNutzungsbedingungen = () => (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-green-800 mb-8">Nutzungsbedingungen</h1>
        
        <Card>
          <CardContent className="p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">1. Geltungsbereich</h2>
              <p className="text-gray-600 leading-relaxed">
                Diese Nutzungsbedingungen gelten für die Nutzung der Green Bin-Plattform 
                und aller damit verbundenen Services.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">2. Leistungsbeschreibung</h2>
              <p className="text-gray-600 leading-relaxed">
                Green Bin ermöglicht es Bürgern, Probleme mit Mülleimern und anderen städtischen 
                Einrichtungen zu melden. Die Weiterleitung erfolgt an die zuständigen Behörden.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">3. Nutzerverhalten</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Meldungen müssen wahrheitsgemäß und sachlich sein</li>
                <li>Missbräuchliche Nutzung ist untersagt</li>
                <li>Respektvoller Umgang mit anderen Nutzern</li>
                <li>Keine Verwendung für rechtswidrige Zwecke</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">4. Haftung</h2>
              <p className="text-gray-600 leading-relaxed">
                Green Bin übernimmt keine Gewähr für die Bearbeitung der Meldungen durch die 
                zuständigen Behörden. Wir sind lediglich Vermittler zwischen Bürgern und Verwaltung.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">5. Änderungen</h2>
              <p className="text-gray-600 leading-relaxed">
                Wir behalten uns vor, diese Nutzungsbedingungen jederzeit zu ändern. 
                Änderungen werden den Nutzern rechtzeitig mitgeteilt.
              </p>
            </div>

            <div className="border-t pt-6">
              <p className="text-sm text-gray-500">
                Stand: Juni 2024 | Durch die Nutzung unserer Plattform stimmen Sie diesen 
                Nutzungsbedingungen zu.
              </p>
            </div>
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
