
import React, { useState } from 'react';
import { User, LogIn, UserPlus, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const UserDropdown = () => {
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log(`${formType} form submitted:`, formData);
    setShowForm(false);
    setFormData({ email: '', password: '', confirmPassword: '' });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const switchForm = (type: 'login' | 'register') => {
    setFormType(type);
    setFormData({ email: '', password: '', confirmPassword: '' });
  };

  const handleForgotPassword = () => {
    console.log('Forgot password clicked');
    // TODO: Implement password reset functionality
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
            >
              {formType === 'login' ? 'Anmelden' : 'Registrieren'}
            </Button>

            {formType === 'login' && (
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleForgotPassword}
                  className="text-sm text-gray-600 hover:text-gray-800 p-0 h-auto font-normal underline"
                >
                  Passwort vergessen?
                </Button>
              </div>
            )}
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
