
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Upload, MapPin, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EnhancedLocationPicker from '@/components/EnhancedLocationPicker';
import ProblemTypeSelect from '@/components/ProblemTypeSelect';
import { useBinReports } from '@/hooks/useBinReports';
import NotificationDialog from '@/components/NotificationDialog';

const Index = () => {
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [issueType, setIssueType] = useState('');
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [partnerMunicipality, setPartnerMunicipality] = useState<string | null>(null);
  const [wasteBinId, setWasteBinId] = useState<string>(''); // CRITICAL: State for waste bin ID
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

  const { toast } = useToast();
  const { submitReport, isSubmitting } = useBinReports();

  const handleLocationChange = (newLocation: string, newCoordinates?: { lat: number; lng: number }) => {
    setLocation(newLocation);
    if (newCoordinates) {
      setCoordinates(newCoordinates);
    }
  };

  const handlePartnerMunicipalityChange = (municipality: string | null) => {
    setPartnerMunicipality(municipality);
  };

  const handleWasteBinSelect = (binId: string, binLocation: string) => {
    console.log('🗑️ Waste bin selected in Index:', binId, binLocation);
    setWasteBinId(binId); // CRITICAL: Set the waste bin ID
  };

  const handleWasteBinIdChange = (id: string) => {
    console.log('🗑️ CRITICAL - Waste bin ID changed in Index:', id);
    setWasteBinId(id); // CRITICAL: Update waste bin ID when manually entered
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location || !issueType) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    console.log('🚀 CRITICAL - Submitting report with waste bin ID:', wasteBinId);
    console.log('🚀 CRITICAL - Waste bin ID type:', typeof wasteBinId);
    console.log('🚀 CRITICAL - Waste bin ID length:', wasteBinId.length);

    const reportData = {
      location,
      issue_type: issueType,
      comment: comment || null,
      photo: photo || null,
      partner_municipality: partnerMunicipality,
      waste_bin_id: wasteBinId || null // CRITICAL: Include waste bin ID in report data
    };

    console.log('🚀 CRITICAL - Full report data:', reportData);

    const submittedReportId = await submitReport(reportData);
    
    if (submittedReportId) {
      setReportId(submittedReportId);
      setIsSubmitted(true);
      setShowNotificationDialog(true);
      
      toast({
        title: "Meldung erfolgreich gesendet!",
        description: "Ihre Meldung wurde erfolgreich übermittelt.",
      });

      // Reset form
      setLocation('');
      setCoordinates(null);
      setIssueType('');
      setComment('');
      setPhoto(null);
      setPhotoPreview(null);
      setPartnerMunicipality(null);
      setWasteBinId(''); // CRITICAL: Reset waste bin ID
    } else {
      toast({
        title: "Fehler",
        description: "Es gab einen Fehler beim Senden der Meldung. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setLocation('');
    setCoordinates(null);
    setIssueType('');
    setComment('');
    setPhoto(null);
    setPhotoPreview(null);
    setPartnerMunicipality(null);
    setWasteBinId(''); // CRITICAL: Reset waste bin ID
  };

  if (isSubmitted) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white shadow-lg">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-800">
                  Meldung erfolgreich gesendet!
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600">
                  Ihre Meldung wurde erfolgreich an die zuständige Stadtverwaltung weitergeleitet.
                </p>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Standort:</strong> {location}
                  </p>
                  {wasteBinId && (
                    <p className="text-sm text-green-800">
                      <strong>Mülleimer ID:</strong> {wasteBinId}
                    </p>
                  )}
                  {partnerMunicipality && (
                    <p className="text-sm text-green-800">
                      <strong>Zuständige Verwaltung:</strong> {partnerMunicipality}
                    </p>
                  )}
                </div>
                <Button onClick={resetForm} className="w-full">
                  Neue Meldung erstellen
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <NotificationDialog
          isOpen={showNotificationDialog}
          onClose={() => setShowNotificationDialog(false)}
          reportId={reportId || ''}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🗑️ Mülleimer Problem melden
          </h1>
          <p className="text-lg text-gray-600">
            Helfen Sie dabei, unsere Stadt sauber zu halten
          </p>
        </div>

        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Problem melden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <EnhancedLocationPicker
                value={location}
                onChange={handleLocationChange}
                onPartnerMunicipalityChange={handlePartnerMunicipalityChange}
                onWasteBinSelect={handleWasteBinSelect}
                coordinates={coordinates}
                onWasteBinIdChange={handleWasteBinIdChange} // CRITICAL: Pass the callback
              />

              <ProblemTypeSelect value={issueType} onChange={setIssueType} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📸 Foto hochladen (optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Vorschau"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Klicken Sie hier, um ein Foto hochzuladen</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Zusätzliche Informationen (optional)
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Beschreiben Sie das Problem genauer..."
                  className="min-h-24"
                />
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Alle mit <span className="text-red-500">*</span> markierten Felder sind Pflichtfelder.
                </AlertDescription>
              </Alert>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Wird gesendet...' : 'Meldung senden'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
