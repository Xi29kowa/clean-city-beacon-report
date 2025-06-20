
import React, { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, Leaf, CheckCircle, ArrowRight, Upload, Menu, X, Info, Shield, Phone, User, LogIn, Share2, Copy, Wifi, Battery, Zap, Database, Monitor, LogOut } from 'lucide-react';
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
    partnerMunicipality: ''
  });
  const [locationCoordinates, setLocationCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [displayCount, setDisplayCount] = useState(0);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [canSubmitReport, setCanSubmitReport] = useState(false);
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

  // Check if report can be submitted based on partner municipality
  useEffect(() => {
    const hasLocation = formData.location?.trim();
    const hasIssueType = formData.issueType;
    const hasPartnerMunicipality = formData.partnerMunicipality;
    
    setCanSubmitReport(Boolean(hasLocation && hasIssueType && hasPartnerMunicipality));
  }, [formData.location, formData.issueType, formData.partnerMunicipality]);

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
    
    console.log('Form submission started with data:', {
      location: formData.location,
      issueType: formData.issueType,
      comment: formData.comment?.trim() || null,
      photo: formData.photo?.name || 'none',
      partnerMunicipality: formData.partnerMunicipality
    });
    
    if (!formData.location?.trim()) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte geben Sie einen Standort an.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.issueType) {
      toast({
        title: "Fehlende Angaben", 
        description: "Bitte wählen Sie eine Problemart aus.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.partnerMunicipality) {
      toast({
        title: "Standort nicht unterstützt",
        description: "Leider unterstützen wir derzeit nur Meldungen in ausgewählten Partnerstädten.",
        variant: "destructive",
      });
      return;
    }
    
    const reportId = await submitReport({
      location: formData.location.trim(),
      issue_type: formData.issueType,
      comment: formData.comment?.trim() || null,
      photo: formData.photo,
      partner_municipality: formData.partnerMunicipality || null
    });

    if (reportId) {
      setCurrentReportId(reportId);
      setCurrentView('confirmation');
      setFormData({ location: '', photo: null, issueType: '', comment: '', partnerMunicipality: '' });
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
    const title = 'CleanCity - Hilf mit, deine Stadt sauber zu halten!';
    const text = 'Melde überfüllte oder beschädigte Mülleimer mit CleanCity und sorge für eine saubere Stadt.';

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
                {/* User Profile Widget */}
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <User className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Hallo, {user?.username}!</span>
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
                  {/* Mobile User Profile Widget */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <User className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Hallo, {user?.username}!</span>
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

        {/* Slideshow Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
          {cityImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentImageIndex 
                  ? 'bg-white shadow-lg' 
                  : 'bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
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
                <Camera className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-semibold mb-2">1. Foto machen</h4>
              <p className="text-gray-600">Fotografiere den problematischen Mülleimer</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">2. Standort senden</h4>
              <p className="text-gray-600">Automatische GPS-Erkennung oder manuelle Eingabe</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">3. Meldung absenden</h4>
              <p className="text-gray-600">Fertig! Die Stadtreinigung wird informiert</p>
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
                  Direkte Datenübertragung an das CleanCity Backend-System.
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
                Sensor bald verfügbar – CleanCity testet aktuell erste Pilotgeräte in Nürnberg.
              </p>
              <p className="text-gray-500 mb-8">
                Unsere intelligenten Sensoren werden in den kommenden Monaten in ausgewählten 
                Stadtteilen getestet, um die Effizienz der Müllentsorgung zu optimieren.
              </p>
              <Button 
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 text-lg rounded-full"
                onClick={() => window.location.href = 'mailto:info@cleancity.de?subject=Interesse an CleanCity Sensoren'}
              >
                Mehr erfahren
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );

  const renderReportForm = () => (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-green-800 flex items-center">
              <Upload className="w-6 h-6 mr-2" />
              Mülleimer melden
            </CardTitle>
            <p className="text-gray-600">
              Helfen Sie uns, problematische Mülleimer schnell zu identifizieren
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Enhanced Location Input with Map */}
              <LocationPicker
                value={formData.location}
                onChange={handleLocationChange}
                onPartnerMunicipalityChange={handlePartnerMunicipalityChange}
              />

              {/* Partner Municipality Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏛️ Partner Stadtverwaltung
                </label>
                <Select 
                  value={formData.partnerMunicipality} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, partnerMunicipality: value }))}
                  disabled={true}
                >
                  <SelectTrigger className={formData.partnerMunicipality ? "bg-green-50 border-green-200" : "bg-gray-100"}>
                    <SelectValue placeholder={
                      formData.partnerMunicipality 
                        ? partnerMunicipalities.find(p => p.value === formData.partnerMunicipality)?.label
                        : "Wird automatisch basierend auf der Adresse ausgewählt"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {partnerMunicipalities.map((municipality) => (
                      <SelectItem key={municipality.value} value={municipality.value}>
                        {municipality.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!formData.partnerMunicipality && formData.location && (
                  <p className="text-xs text-orange-600 mt-1 bg-orange-50 p-2 rounded">
                    ⚠️ Leider unterstützen wir derzeit nur Meldungen in ausgewählten Partnerstädten.
                  </p>
                )}
                {formData.partnerMunicipality && (
                  <p className="text-xs text-green-600 mt-1 bg-green-50 p-2 rounded">
                    ✅ Zuständige Stadtverwaltung automatisch erkannt
                  </p>
                )}
              </div>

              {/* Foto Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📷 Foto (optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">
                      {formData.photo ? formData.photo.name : 'Foto aufnehmen oder auswählen'}
                    </p>
                  </label>
                </div>
              </div>

              {/* Problem Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Problem-Art *
                </label>
                <Select 
                  value={formData.issueType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, issueType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen Sie das Problem aus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overfilled">🗑️ Überfüllt</SelectItem>
                    <SelectItem value="broken">🔧 Beschädigt</SelectItem>
                    <SelectItem value="smelly">💨 Stinkt</SelectItem>
                    <SelectItem value="vandalized">⚠️ Vandalismus</SelectItem>
                    <SelectItem value="missing">❌ Fehlt komplett</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zusätzliche Informationen (optional)
                </label>
                <Textarea
                  placeholder="Beschreiben Sie das Problem genauer..."
                  value={formData.comment}
                  onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || !canSubmitReport}
                className={`w-full py-3 text-lg ${
                  canSubmitReport 
                    ? "bg-green-500 hover:bg-green-600" 
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Wird gesendet...
                  </div>
                ) : (
                  canSubmitReport ? 'Meldung absenden' : 'Standort in Partnerstadt erforderlich'
                )}
              </Button>
            </form>
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

  const renderKarte = () => (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4 text-center text-green-800">Mülleimer-Karte Nürnberg</h1>
        <div className="bg-white rounded-lg shadow-lg p-4">
          <iframe 
            src="https://routenplanung.vercel.app/nbg_wastebaskets_map.html"
            className="w-full h-96 md:h-[600px] border rounded-lg"
            title="Mülleimer Karte"
          />
        </div>
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
