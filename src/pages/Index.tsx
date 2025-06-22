
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import LocationPicker from '@/components/LocationPicker';
import EnhancedLocationPicker from '@/components/EnhancedLocationPicker';
import ProblemTypeSelect from '@/components/ProblemTypeSelect';
import UserDropdown from '@/components/UserDropdown';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, MapPin, FileText, User, Menu, X, Loader2 } from 'lucide-react';
import { useBinReports } from '@/hooks/useBinReports';
import { useStatistics } from '@/hooks/useStatistics';
import { useReportsData } from '@/hooks/useReportsData';
import NativeLeafletMap from '@/components/NativeLeafletMap';

const Index = () => {
  const [activeTab, setActiveTab] = useState('melden');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    location: '',
    problemType: '',
    description: '',
    coordinates: null as { lat: number; lng: number } | null,
    wasteBinId: '',
    partnerMunicipality: null as string | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedWasteBasketId, setSelectedWasteBasketId] = useState('');

  const { user } = useAuth();
  const { toast } = useToast();
  const { data: reports = [], refetch: refetchReports } = useReportsData();
  const { statistics = { total_reports: 0, in_progress_reports: 0, processed_reports: 0 } } = useStatistics();

  useEffect(() => {
    // Fetch reports on component mount
    refetchReports();
  }, [refetchReports]);

  const handleLocationChange = (location: string, coordinates?: { lat: number; lng: number }) => {
    setFormData(prev => ({ ...prev, location, coordinates }));
  };

  const handleProblemTypeChange = (problemType: string) => {
    setFormData(prev => ({ ...prev, problemType }));
  };

  const handleDescriptionChange = (description: string) => {
    setFormData(prev => ({ ...prev, description }));
  };

  const handleWasteBinIdChange = (wasteBinId: string) => {
    setFormData(prev => ({ ...prev, wasteBinId }));
  };

  const handlePartnerMunicipalityChange = (municipality: string | null) => {
    setFormData(prev => ({ ...prev, partnerMunicipality: municipality }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!formData.location) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Standort an.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.problemType) {
      toast({
        title: "Fehler", 
        description: "Bitte wählen Sie ein Problem aus.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.wasteBinId) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine Mülleimer ID an.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const reportData = {
        location: formData.location,
        issue_type: formData.problemType,
        comment: formData.description || null,
        user_id: user.id,
        status: 'in_progress',
        waste_bin_id: formData.wasteBinId,
        partner_municipality: formData.partnerMunicipality,
        coordinates: formData.coordinates ? 
          `POINT(${formData.coordinates.lng} ${formData.coordinates.lat})` : null,
      };

      console.log('Submitting report data:', reportData);

      const { data, error } = await supabase
        .from('bin_reports')
        .insert([reportData])
        .select();

      if (error) {
        console.error('Error submitting report:', error);
        throw error;
      }

      console.log('Report submitted successfully:', data);

      toast({
        title: "Meldung erfolgreich eingereicht",
        description: "Vielen Dank für Ihre Meldung! Sie wird bearbeitet.",
      });

      // Reset form
      setFormData({
        location: '',
        problemType: '',
        description: '',
        coordinates: null,
        wasteBinId: '',
        partnerMunicipality: null,
      });
      setSelectedWasteBasketId('');

      // Refetch reports to update the list
      refetchReports();

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Fehler",
        description: "Beim Einreichen der Meldung ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportWasteBasket = () => {
    if (!selectedWasteBasketId) {
      toast({
        title: "Kein Mülleimer ausgewählt",
        description: "Bitte wählen Sie zuerst einen Mülleimer auf der Karte aus.",
        variant: "destructive",
      });
      return;
    }

    // Pre-fill form and switch to report tab
    setFormData(prev => ({
      ...prev,
      wasteBinId: selectedWasteBasketId,
      location: prev.location || `Standort Mülleimer ${selectedWasteBasketId}`
    }));
    
    setActiveTab('melden');
    
    toast({
      title: "Mülleimer vorausgewählt",
      description: `WasteBasket ID ${selectedWasteBasketId} wurde in das Formular übernommen.`,
    });
  };

  const renderHeader = () => (
    <header className="bg-green-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Trash2 className="w-8 h-8" />
            <h1 className="text-xl font-bold hidden sm:block">Saubere Stadt Nürnberg</h1>
            <h1 className="text-lg font-bold sm:hidden">Saubere Stadt</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            <button
              onClick={() => setActiveTab('melden')}
              className={`pb-4 pt-4 px-2 border-b-2 transition-colors ${
                activeTab === 'melden'
                  ? 'border-white text-white'
                  : 'border-transparent text-green-100 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-1">
                <FileText className="w-4 h-4" />
                <span>Melden</span>
              </div>
            </button>

            {user && (
              <button
                onClick={() => setActiveTab('karte')}
                className={`pb-4 pt-4 px-2 border-b-2 transition-colors ${
                  activeTab === 'karte'
                    ? 'border-white text-white'
                    : 'border-transparent text-green-100 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>Karte</span>
                </div>
              </button>
            )}

            <button
              onClick={() => setActiveTab('meldungen')}
              className={`pb-4 pt-4 px-2 border-b-2 transition-colors ${
                activeTab === 'meldungen'
                  ? 'border-white text-white'
                  : 'border-transparent text-green-100 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-1">
                <Trash2 className="w-4 h-4" />
                <span>Meldungen</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('account')}
              className={`pb-4 pt-4 px-2 border-b-2 transition-colors ${
                activeTab === 'account'
                  ? 'border-white text-white'
                  : 'border-transparent text-green-100 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>Account</span>
              </div>
            </button>
          </nav>

          {/* User Dropdown / Auth Button */}
          <div className="hidden md:block">
            {user ? (
              <UserDropdown />
            ) : (
              <Button
                onClick={() => setIsAuthModalOpen(true)}
                variant="outline"
                className="text-green-600 border-white hover:bg-white"
              >
                Anmelden
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-green-500 py-4">
            <div className="space-y-2">
              <button
                onClick={() => {
                  setActiveTab('melden');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2 rounded ${
                  activeTab === 'melden'
                    ? 'bg-green-700 text-white'
                    : 'text-green-100 hover:bg-green-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Melden</span>
                </div>
              </button>

              {user && (
                <button
                  onClick={() => {
                    setActiveTab('karte');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 rounded ${
                    activeTab === 'karte'
                      ? 'bg-green-700 text-white'
                      : 'text-green-100 hover:bg-green-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>Karte</span>
                  </div>
                </button>
              )}

              <button
                onClick={() => {
                  setActiveTab('meldungen');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2 rounded ${
                  activeTab === 'meldungen'
                    ? 'bg-green-700 text-white'
                    : 'text-green-100 hover:bg-green-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Trash2 className="w-4 h-4" />
                  <span>Meldungen</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('account');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2 rounded ${
                  activeTab === 'account'
                    ? 'bg-green-700 text-white'
                    : 'text-green-100 hover:bg-green-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Account</span>
                </div>
              </button>

              <Separator className="my-2 bg-green-500" />
              
              {user ? (
                <div className="px-4 py-2">
                  <UserDropdown />
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsAuthModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 rounded text-green-100 hover:bg-green-700"
                >
                  Anmelden
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );

  const renderKarte = () => (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-green-800">
          🗺️ Interaktive Mülleimer-Karte Nürnberg
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Native Leaflet Map Component */}
          <NativeLeafletMap
            onWasteBasketSelect={(binId, binLocation) => {
              console.log('Waste bin selected:', binId, binLocation);
              setSelectedWasteBasketId(binId);
              setFormData(prev => ({ 
                ...prev, 
                wasteBinId: binId,
                location: binLocation || `Standort Mülleimer ${binId}`
              }));
              toast({
                title: "Mülleimer ausgewählt",
                description: `WasteBasket ID: ${binId} - ${binLocation}`,
              });
            }}
          />

          {/* Action Button */}
          <div className="flex justify-center mt-6">
            <Button
              onClick={handleReportWasteBasket}
              disabled={!selectedWasteBasketId}
              className={`px-8 py-3 text-lg font-semibold ${
                selectedWasteBasketId
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {selectedWasteBasketId ? 'Mülleimer melden' : 'Zuerst Mülleimer auswählen'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMelden = () => (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-green-800">
          🗑️ Mülleimer Problem melden
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <EnhancedLocationPicker
              value={formData.location}
              onChange={(location, coordinates) => {
                setFormData(prev => ({ ...prev, location, coordinates }));
              }}
              onPartnerMunicipalityChange={(municipality) => {
                setFormData(prev => ({ ...prev, partnerMunicipality: municipality }));
              }}
              onWasteBinSelect={(binId, location) => {
                console.log('Waste bin selected from picker:', binId, location);
                setFormData(prev => ({ ...prev, wasteBinId: binId, location }));
              }}
              coordinates={formData.coordinates}
              onWasteBinIdChange={(binId) => {
                console.log('Waste bin ID changed from picker:', binId);
                setFormData(prev => ({ ...prev, wasteBinId: binId }));
              }}
              wasteBinId={formData.wasteBinId}
            />

            <ProblemTypeSelect
              value={formData.problemType}
              onValueChange={(problemType) => setFormData(prev => ({ ...prev, problemType }))}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zusätzliche Beschreibung (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Beschreiben Sie das Problem genauer..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={4}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Wird eingereicht...
                </>
              ) : (
                'Meldung einreichen'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );

  const renderMeldungen = () => (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-green-800">
          📊 Meldungen Dashboard
        </h1>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gesamt Meldungen</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_reports}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Bearbeitung</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.in_progress_reports}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Erledigt</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.processed_reports}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Alle Meldungen</h2>
          </div>
          <div className="overflow-x-auto">
            {reports.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Datum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Standort
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mülleimer ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Problem
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(report.created_at).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {report.waste_bin_id || 'Nicht angegeben'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.issue_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          report.status === 'processed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {report.status === 'processed' ? 'Erledigt' : 'In Bearbeitung'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-12 text-center">
                <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Noch keine Meldungen vorhanden.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAccount = () => (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-green-800">
          👤 Mein Account
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          {user ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">E-Mail</label>
                <p className="mt-1 text-sm text-gray-900">{user.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Benutzername</label>
                <p className="mt-1 text-sm text-gray-900">{user.username}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Benutzer ID</label>
                <p className="mt-1 text-sm text-gray-500 font-mono">{user.id}</p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-500 mb-4">Sie sind nicht angemeldet.</p>
              <Button onClick={() => setIsAuthModalOpen(true)}>
                Jetzt anmelden
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  let content;

  if (activeTab === 'karte' && user) {
    content = renderKarte();
  } else if (activeTab === 'meldungen') {
    content = renderMeldungen();
  } else if (activeTab === 'account') {
    content = renderAccount();
  } else {
    content = renderMelden();
  }

  return (
    <>
      {content}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
};

export default Index;
