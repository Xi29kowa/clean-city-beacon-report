
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { validateRegistration } from "@/utils/authValidation";
import LoginForm from './auth/LoginForm';
import RegisterForm from './auth/RegisterForm';

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
        const validation = validateRegistration(
          formData.username,
          formData.email,
          formData.password,
          formData.confirmPassword
        );

        if (!validation.isValid) {
          toast({
            title: validation.error,
            description: "Bitte überprüfen Sie Ihre Eingabe.",
            variant: "destructive",
          });
          return;
        }

        const result = await register(formData.username, formData.email, formData.password);
        
        if (result.success) {
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
        
        {isLogin ? (
          <LoginForm
            email={formData.email}
            password={formData.password}
            isLoading={isLoading}
            onEmailChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
            onPasswordChange={(value) => setFormData(prev => ({ ...prev, password: value }))}
            onSubmit={handleSubmit}
          />
        ) : (
          <RegisterForm
            username={formData.username}
            email={formData.email}
            password={formData.password}
            confirmPassword={formData.confirmPassword}
            isLoading={isLoading}
            onUsernameChange={(value) => setFormData(prev => ({ ...prev, username: value }))}
            onEmailChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
            onPasswordChange={(value) => setFormData(prev => ({ ...prev, password: value }))}
            onConfirmPasswordChange={(value) => setFormData(prev => ({ ...prev, confirmPassword: value }))}
            onSubmit={handleSubmit}
          />
        )}
        
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
