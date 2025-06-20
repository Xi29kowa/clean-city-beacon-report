
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    setIsLoading(true);

    try {
      if (isLogin) {
        console.log('🔑 Attempting login...');
        
        const result = await login(formData.email, formData.password);
        
        if (result.success) {
          toast({
            title: "Erfolgreich angemeldet!",
            description: "Willkommen zurück!",
          });
          resetForm();
          onClose();
        } else {
          toast({
            title: "Anmeldung fehlgeschlagen",
            description: result.error,
            variant: "destructive",
          });
        }
      } else {
        // Registration validation
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Passwörter stimmen nicht überein",
            description: "Bitte überprüfen Sie Ihre Passwort-Eingabe.",
            variant: "destructive",
          });
          return;
        }

        if (formData.password.length < 6) {
          toast({
            title: "Passwort zu kurz",
            description: "Das Passwort muss mindestens 6 Zeichen lang sein.",
            variant: "destructive",
          });
          return;
        }

        if (!formData.username.trim()) {
          toast({
            title: "Benutzername erforderlich",
            description: "Bitte geben Sie einen Benutzernamen ein.",
            variant: "destructive",
          });
          return;
        }

        if (!formData.email.trim() || !formData.email.includes('@')) {
          toast({
            title: "Ungültige E-Mail",
            description: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
            variant: "destructive",
          });
          return;
        }

        console.log('📝 Attempting registration...');
        const result = await register(formData.username, formData.email, formData.password);
        
        if (result.success) {
          // Check if there's an error message (like email confirmation needed)
          if (result.error) {
            toast({
              title: "Registrierung erfolgreich!",
              description: result.error,
            });
          } else {
            toast({
              title: "Registrierung erfolgreich!",
              description: "Sie wurden automatisch angemeldet.",
            });
          }
          resetForm();
          onClose();
        } else {
          toast({
            title: "Registrierung fehlgeschlagen",
            description: result.error,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isLogin ? 'Anmelden' : 'Registrieren'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <Label htmlFor="username">Benutzername</Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                required={!isLogin}
                placeholder="Benutzername"
                disabled={isLoading}
              />
            </div>
          )}

          <div>
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="E-Mail"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <Label htmlFor="password">Passwort</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Passwort"
              disabled={isLoading}
            />
          </div>
          
          {!isLogin && (
            <div>
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required={!isLogin}
                placeholder="Passwort bestätigen"
                disabled={isLoading}
              />
            </div>
          )}
          
          <Button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isLogin ? 'Anmelden...' : 'Registrieren...'}
              </div>
            ) : (
              isLogin ? 'Anmelden' : 'Registrieren'
            )}
          </Button>
        </form>
        
        <div className="text-center">
          <Button
            variant="link"
            onClick={switchMode}
            className="text-green-600 hover:text-green-700"
            disabled={isLoading}
          >
            {isLogin ? 'Noch kein Konto? Jetzt registrieren' : 'Bereits ein Konto? Jetzt anmelden'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
