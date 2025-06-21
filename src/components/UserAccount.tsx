
import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, MapPin, Phone, FileText, Calendar, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  address: string | null;
  phone: string | null;
}

interface Report {
  id: string;
  fallnummer: string;
  timestamp: string;
  standort: string;
  problem: string;
  gemeinde: string;
  muelleimerID: string;
  kommentar: string;
}

const UserAccount = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Profile form data
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    address: '',
    phone: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Report form data
  const [address, setAddress] = useState('');
  const [wasteBasketId, setWasteBasketId] = useState('');
  const [problemType, setProblemType] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadReports();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      console.log('Loading profile for user:', user?.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, address, phone')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        console.log('Profile loaded:', data);
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
      } else {
        console.log('No profile found, creating default values');
        setFormData({
          first_name: '',
          last_name: '',
          address: '',
          phone: '',
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReports = () => {
    const saved = JSON.parse(localStorage.getItem('meldungen') || '[]');
    setReports(saved);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create new report with EXACT user input
    const newReport: Report = {
      id: Date.now().toString(),
      fallnummer: `CASE-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      standort: address,           // EXACT address user typed
      problem: problemType,        // EXACT problem user selected  
      gemeinde: 'Nürnberg',       // Always Nürnberg
      muelleimerID: wasteBasketId, // EXACT ID user typed manually
      kommentar: description       // EXACT comment user typed
    };
    
    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem('meldungen') || '[]');
    const updated = [...existing, newReport];
    localStorage.setItem('meldungen', JSON.stringify(updated));
    
    // Update state
    setReports(updated);
    
    alert('Meldung erfolgreich eingereicht!');
    
    // Reset form
    setAddress('');
    setWasteBasketId('');
    setProblemType('');
    setDescription('');
  };

  const deleteReport = (reportId: string) => {
    // Remove from array
    const updated = reports.filter(r => r.id !== reportId);
    
    // Save to localStorage
    localStorage.setItem('meldungen', JSON.stringify(updated));
    
    // Update state
    setReports(updated);
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

      if (error) {
        console.error('Update error:', error);
        toast({
          title: "Fehler",
          description: "Fehler beim Speichern der Daten.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Profil aktualisiert",
          description: "Ihre persönlichen Daten wurden erfolgreich gespeichert.",
        });
        await loadUserProfile();
      }
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

  const getIssueTypeText = (issueType: string) => {
    switch (issueType) {
      case 'full':
        return 'Überfüllt';
      case 'damaged':
        return 'Beschädigt';
      case 'missing':
        return 'Fehlt';
      case 'dirty':
        return 'Verschmutzt';
      case 'blocked':
        return 'Blockiert';
      case 'other':
        return 'Sonstiges';
      default:
        return issueType;
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

      <Tabs defaultValue="report" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="report">Mülleimer melden</TabsTrigger>
          <TabsTrigger value="reports">Meine Meldungen</TabsTrigger>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="security">Sicherheit</TabsTrigger>
        </TabsList>

        <TabsContent value="report">
          <Card>
            <CardHeader>
              <CardTitle>Mülleimer melden</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="address">Standort</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Adresse eingeben"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="wasteBasketId">Mülleimer-ID</Label>
                  <Input
                    id="wasteBasketId"
                    value={wasteBasketId}
                    onChange={(e) => setWasteBasketId(e.target.value)}
                    placeholder="ID eingeben"
                  />
                </div>

                <div>
                  <Label htmlFor="problemType">Problem</Label>
                  <Select value={problemType} onValueChange={setProblemType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Problem auswählen" />
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
                  <Label htmlFor="description">Kommentar</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Beschreibung (optional)"
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full bg-green-500 hover:bg-green-600">
                  Meldung einreichen
                </Button>
              </form>
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
                  {reports.map(report => (
                    <div key={report.id} className="border p-4 rounded mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">Fallnummer: {report.fallnummer}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {new Date(report.timestamp).toLocaleString('de-DE')}
                          </span>
                          <button 
                            onClick={() => deleteReport(report.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong>Standort:</strong>
                          <p>{report.standort}</p>
                        </div>
                        <div>
                          <strong>Problem:</strong>
                          <p>{getIssueTypeText(report.problem)}</p>
                        </div>
                        <div>
                          <strong>Mülleimer-ID:</strong>
                          <p>{report.muelleimerID || 'Nicht angegeben'}</p>
                        </div>
                        <div>
                          <strong>Gemeinde:</strong>
                          <p>{report.gemeinde}</p>
                        </div>
                      </div>
                      
                      {report.kommentar && (
                        <div className="mt-2">
                          <strong>Kommentar:</strong>
                          <p>{report.kommentar}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
      </Tabs>
    </div>
  );
};

export default UserAccount;
