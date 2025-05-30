import React, { useState } from 'react';
import { Camera, MapPin, Leaf, CheckCircle, ArrowRight, Upload, Menu, X, Info, Shield, Phone } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [currentView, setCurrentView] = useState('home');
  const [showMenu, setShowMenu] = useState(false);
  const [formData, setFormData] = useState({
    location: '',
    photo: null,
    issueType: '',
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleLocationCapture = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({ 
            ...prev, 
            location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` 
          }));
          toast({
            title: "Standort erfasst!",
            description: "GPS-Koordinaten wurden zu Ihrer Meldung hinzugefügt.",
          });
        },
        (error) => {
          toast({
            title: "Standortzugriff verweigert",
            description: "Bitte geben Sie den Standort manuell ein.",
            variant: "destructive",
          });
        }
      );
    }
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
    if (!formData.location || !formData.issueType) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte füllen Sie mindestens Standort und Problemart aus.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulation der Übermittlung
    setTimeout(() => {
      setIsSubmitting(false);
      setCurrentView('confirmation');
      setFormData({ location: '', photo: null, issueType: '', comment: '' });
    }, 2000);
  };

  const renderHeader = () => (
    <header className="bg-white shadow-sm border-b border-green-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2" onClick={() => setCurrentView('home')} style={{ cursor: 'pointer' }}>
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-green-800">CleanCity</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMenu(!showMenu)}
          className="md:hidden"
        >
          {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
        <nav className="hidden md:flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentView('home')}
            className={currentView === 'home' ? 'text-green-600' : ''}
          >
            Start
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setCurrentView('info')}
            className={currentView === 'info' ? 'text-green-600' : ''}
          >
            Info
          </Button>
        </nav>
      </div>
      
      {/* Mobile Menu */}
      {showMenu && (
        <div className="md:hidden bg-white border-t border-green-100 px-4 py-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start mb-2" 
            onClick={() => { setCurrentView('home'); setShowMenu(false); }}
          >
            Start
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start" 
            onClick={() => { setCurrentView('info'); setShowMenu(false); }}
          >
            Info & Einstellungen
          </Button>
        </div>
      )}
    </header>
  );

  const renderHome = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {renderHeader()}
      
      {/* Hero Section with Background Image */}
      <section 
        className="px-4 py-12 text-center relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.8), rgba(16, 185, 129, 0.6)), url('https://images.unsplash.com/photo-1426604966848-d7adac402bff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="container mx-auto max-w-4xl relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg">
            Hilf mit, deine Stadt sauber zu halten!
          </h2>
          <p className="text-lg text-white mb-8 max-w-2xl mx-auto drop-shadow-md">
            Melde überfüllte oder beschädigte Mülleimer schnell und einfach. 
            Gemeinsam sorgen wir für eine saubere und lebenswerte Stadt.
          </p>
          <Button 
            onClick={() => setCurrentView('report')}
            className="bg-white hover:bg-gray-100 text-green-600 px-8 py-3 text-lg rounded-full shadow-lg transform transition hover:scale-105 font-semibold"
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

      {/* Impact Counter */}
      <section className="px-4 py-12 bg-green-50">
        <div className="container mx-auto max-w-2xl text-center">
          <h3 className="text-2xl font-bold text-green-800 mb-4">Unser gemeinsamer Erfolg</h3>
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <div className="text-4xl font-bold text-green-600 mb-2">2.318</div>
            <p className="text-gray-600">Mülleimer bereits gemeldet</p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-semibold text-blue-600">1.847</div>
                <div className="text-gray-500">Bereits bearbeitet</div>
              </div>
              <div>
                <div className="font-semibold text-orange-600">471</div>
                <div className="text-gray-500">In Bearbeitung</div>
              </div>
            </div>
          </div>
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
              {/* Standort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📍 Standort
                </label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Adresse oder GPS-Koordinaten"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleLocationCapture}
                    variant="outline"
                    className="whitespace-nowrap"
                  >
                    <MapPin className="w-4 h-4 mr-1" />
                    GPS
                  </Button>
                </div>
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
                disabled={isSubmitting}
                className="w-full bg-green-500 hover:bg-green-600 py-3 text-lg"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Wird gesendet...
                  </div>
                ) : (
                  'Meldung absenden'
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
              <Button variant="outline" className="w-full">
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
              <Button variant="outline" className="w-full">
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
    </div>
  );

  const renderInfo = () => (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h2 className="text-3xl font-bold text-green-800 mb-8">Info & Einstellungen</h2>
        
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
              <Button variant="outline" className="w-full justify-start">
                Datenschutzerklärung
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Impressum
              </Button>
              <Button variant="outline" className="w-full justify-start">
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

  // Main render logic
  switch (currentView) {
    case 'report':
      return renderReportForm();
    case 'confirmation':
      return renderConfirmation();
    case 'info':
      return renderInfo();
    default:
      return renderHome();
  }
};

export default Index;
