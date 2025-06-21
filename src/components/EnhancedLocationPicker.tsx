
import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle, Check, Camera } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useBinReports } from '@/hooks/useBinReports';
import { useAuth } from '@/contexts/AuthContext';
import NotificationDialog from './NotificationDialog';

const EnhancedLocationPicker = () => {
  // All state variables
  const [address, setAddress] = useState('');
  const [issueType, setIssueType] = useState('');
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [wasteBinId, setWasteBinId] = useState('');
  const [partnerMunicipality, setPartnerMunicipality] = useState('');
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);

  const { toast } = useToast();
  const { submitReport, isSubmitting } = useBinReports();
  const { user } = useAuth();

  // Helper functions
  const resetForm = () => {
    setAddress('');
    setIssueType('');
    setComment('');
    setPhoto(null);
    setWasteBinId('');
    setPartnerMunicipality('');
    const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Fehler",
        description: "Sie müssen angemeldet sein, um eine Meldung zu erstellen.",
        variant: "destructive"
      });
      return;
    }

    if (!address.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine Adresse an.",
        variant: "destructive"
      });
      return;
    }

    if (!issueType) {
      toast({
        title: "Fehler", 
        description: "Bitte wählen Sie ein Problem aus.",
        variant: "destructive"
      });
      return;
    }

    console.log('🚀 FORM SUBMISSION - Mülleimer ID eingegeben:', wasteBinId);

    const reportData = {
      location: address.trim(),
      issue_type: issueType,
      comment: comment.trim() || null,
      photo: photo,
      partner_municipality: partnerMunicipality || null,
      waste_bin_id: wasteBinId.trim() || null  // KRITISCH: Mülleimer-ID hier korrekt übergeben
    };

    console.log('🗑️ FINAL REPORT DATA WITH WASTE_BIN_ID:', reportData);
    console.log('🗑️ WASTE_BIN_ID VALUE BEING SENT:', reportData.waste_bin_id);

    const reportId = await submitReport(reportData);

    if (reportId) {
      console.log('✅ Report submitted successfully with ID:', reportId);
      toast({
        title: "Erfolgreich gemeldet!",
        description: "Ihre Meldung wurde erfolgreich eingereicht.",
      });
      setSubmittedReportId(reportId);
      setShowNotificationDialog(true);
      resetForm();
    } else {
      toast({
        title: "Fehler",
        description: "Fehler beim Einreichen der Meldung. Bitte versuchen Sie es erneut.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Mülleimer melden</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="address">Standort *</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Geben Sie die Adresse ein..."
                required
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="waste-bin-id">Mülleimer ID *</Label>
              <Input
                id="waste-bin-id"
                value={wasteBinId}
                onChange={(e) => {
                  const value = e.target.value;
                  console.log('🗑️ WASTE BIN ID INPUT CHANGED TO:', value);
                  setWasteBinId(value);
                }}
                placeholder="Geben Sie die Mülleimer-ID ein (z.B. 12345)..."
                className="w-full"
              />
              <p className="text-sm text-gray-500 mt-1">
                Die ID finden Sie am Mülleimer aufgeklebt
              </p>
            </div>

            <div>
              <Label htmlFor="issue-type">Problem *</Label>
              <Select value={issueType} onValueChange={setIssueType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Wählen Sie ein Problem..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Überfüllt</SelectItem>
                  <SelectItem value="damaged">Beschädigt</SelectItem>
                  <SelectItem value="missing">Fehlt</SelectItem>
                  <SelectItem value="dirty">Verschmutzt</SelectItem>
                  <SelectItem value="blocked">Blockiert</SelectItem>
                  <SelectItem value="other">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="partner-municipality">Gemeinde (optional)</Label>
              <Input
                id="partner-municipality"
                value={partnerMunicipality}
                onChange={(e) => setPartnerMunicipality(e.target.value)}
                placeholder="z.B. Nürnberg, Fürth, Erlangen..."
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="photo-upload">Foto (optional)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="flex-1"
                />
                <Camera className="w-5 h-5 text-gray-400" />
              </div>
              {photo && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ Foto ausgewählt: {photo.name}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="comment">Zusätzliche Kommentare (optional)</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Beschreiben Sie das Problem genauer..."
                rows={3}
                className="w-full"
              />
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              {isSubmitting ? 'Meldung wird eingereicht...' : 'Meldung einreichen'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <NotificationDialog 
        isOpen={showNotificationDialog}
        onClose={() => setShowNotificationDialog(false)}
        reportId={submittedReportId}
      />
    </div>
  );
};

export default EnhancedLocationPicker;
