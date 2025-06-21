
import React, { useState } from 'react';
import { User, LogIn, UserPlus, X, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserDropdown = () => {
  const { user, login, register, logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (formType === 'register') {
        if (formData.password !== formData.confirmPassword) {
          alert('Passwörter stimmen nicht überein');
          return;
        }
        const result = await register(formData.username, formData.email, formData.password);
        if (result.success) {
          setShowForm(false);
          setFormData({ username: '', email: '', password: '', confirmPassword: '' });
        } else {
          alert(result.error || 'Registrierung fehlgeschlagen');
        }
      } else {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          setShowForm(false);
          setFormData({ username: '', email: '', password: '', confirmPassword: '' });
        } else {
          alert(result.error || 'Anmeldung fehlgeschlagen');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert('Ein Fehler ist aufgetreten');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const switchForm = (type: 'login' | 'register') => {
    setFormType(type);
    setFormData({ username: '', email: '', password: '', confirmPassword: '' });
  };

  const handleAccountClick = () => {
    navigate('/account');
  };

  const handleLogout = () => {
    logout();
  };

  if (showForm) {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-md"
          onClick={() => setShowForm(false)}
        >
          <User className="w-5 h-5" />
          <span className="hidden lg:inline text-sm font-medium">Login</span>
        </Button>
        
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-6 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {formType === 'login' ? 'Anmelden' : 'Registrieren'}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {formType === 'register' && (
              <div>
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Benutzername
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                E-Mail
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Passwort
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="mt-1"
                required
              />
            </div>

            {formType === 'register' && (
              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Passwort bestätigen
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Wird verarbeitet...' : (formType === 'login' ? 'Anmelden' : 'Registrieren')}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600">
              {formType === 'login' ? 'Noch kein Konto?' : 'Bereits registriert?'}
            </span>
            <Button
              variant="ghost"
              onClick={() => switchForm(formType === 'login' ? 'register' : 'login')}
              className="ml-1 text-green-600 hover:text-green-700 text-sm p-0 h-auto font-medium"
            >
              {formType === 'login' ? 'Registrieren' : 'Anmelden'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoggedIn && user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-md"
          >
            <User className="w-5 h-5" />
            <span className="hidden lg:inline text-sm font-medium">{user.username}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-white">
          <DropdownMenuItem 
            className="cursor-pointer"
            onClick={handleAccountClick}
          >
            <Settings className="w-4 h-4 mr-2" />
            Mein Konto
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="cursor-pointer text-red-600"
            onClick={handleLogout}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Abmelden
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-md"
        >
          <User className="w-5 h-5" />
          <span className="hidden lg:inline text-sm font-medium">Login</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-white">
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => {
            setFormType('login');
            setShowForm(true);
          }}
        >
          <LogIn className="w-4 h-4 mr-2" />
          Anmelden
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => {
            setFormType('register');
            setShowForm(true);
          }}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Registrieren
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
