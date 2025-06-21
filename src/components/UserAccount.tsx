
import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, MapPin, Phone, FileText, Calendar, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  phone?: string;
}

interface BinReport {
  id: string;
  case_number: string;
  location: string;
  issue_type: string;
  comment?: string;
  created_at: string;
  status: string;
  partner_municipality?: string;
}

const UserAccount = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reports, setReports] = useState<BinReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    address: '',
    phone: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadUserReports();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      setProfile(data);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        address: data.address || '',
        phone: data.phone || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadUserReports = async () => {
    try {
      const { data, error } = await supabase
        .from('bin_reports')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading reports:', error);
        return;
      }

      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          address: formData.address,
          phone: formData.phone
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profil aktualisiert",
        description: "Ihre persönlichen Daten wurden erfolgreich gespeichert.",
      });

      await loadUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Speichern der Daten.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const updatePassword = async () => {
    if (formData.new_password !== formData.confirm_password) {
      toast({
        title: "Fehler",
        description: "Die Passwörter stimmen nicht überein.",
        variant: "destructive"
      });
      return;
    }

    if (formData.new_password.length < 6) {
      toast({
        title: "Fehler", 
        description: "Das Passwort muss mindestens 6 Zeichen lang sein.",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.new_password
      });

      if (error) throw error;

      toast({
        title: "Passwort geändert",
        description: "Ihr Passwort wurde erfolgreich aktualisiert.",
      });

      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Ändern des Passworts.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-50';
      case 'processed':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Bearbeitung';
      case 'processed':
        return 'Bearbeitet';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mein Konto</h1>
        <Button variant="outline" onClick={logout}>
          Abmelden
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="security">Sicherheit</TabsTrigger>
          <TabsTrigger value="reports">Meine Meldungen</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Persönliche Daten</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">E-Mail-Adresse</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    E-Mail-Adresse kann nicht geändert werden
                  </p>
                </div>
                <div>
                  <Label htmlFor="username">Benutzername</Label>
                  <Input
                    id="username"
                    value={profile?.username || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Vorname</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Vorname eingeben"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Nachname</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Nachname eingeben"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Vollständige Adresse eingeben"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefonnummer</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Telefonnummer eingeben"
                />
              </div>

              <Button 
                onClick={updateProfile} 
                disabled={isUpdating}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                {isUpdating ? 'Speichern...' : 'Änderungen speichern'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="w-5 h-5" />
                <span>Passwort ändern</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="new_password">Neues Passwort</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={formData.new_password}
                  onChange={(e) => setFormData(prev => ({ ...prev, new_password: e.target.value }))}
                  placeholder="Neues Passwort eingeben"
                />
              </div>

              <div>
                <Label htmlFor="confirm_password">Passwort bestätigen</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
                  placeholder="Passwort wiederholen"
                />
              </div>

              <Button 
                onClick={updatePassword} 
                disabled={isUpdating || !formData.new_password || !formData.confirm_password}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                {isUpdating ? 'Ändern...' : 'Passwort ändern'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Meine Meldungen ({reports.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Sie haben noch keine Mülleimer gemeldet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">
                            Fallnummer: {report.case_number}
                          </h3>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                            {getStatusText(report.status)}
                          </span>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(report.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="font-medium">Standort:</p>
                            <p className="text-gray-600">{report.location}</p>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">Problem:</p>
                          <p className="text-gray-600">{report.issue_type}</p>
                        </div>
                        {report.partner_municipality && (
                          <div>
                            <p className="font-medium">Gemeinde:</p>
                            <p className="text-gray-600">{report.partner_municipality}</p>
                          </div>
                        )}
                        {report.comment && (
                          <div>
                            <p className="font-medium">Kommentar:</p>
                            <p className="text-gray-600">{report.comment}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserAccount;
