
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RegisterFormProps {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  isLoading: boolean;
  onUsernameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  username,
  email,
  password,
  confirmPassword,
  isLoading,
  onUsernameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="username">Benutzername</Label>
        <Input
          id="username"
          name="username"
          type="text"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          required
          placeholder="Benutzername"
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="email">E-Mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
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
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          required
          placeholder="Passwort"
          disabled={isLoading}
        />
      </div>
      
      <div>
        <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
          required
          placeholder="Passwort bestätigen"
          disabled={isLoading}
        />
      </div>
      
      <Button
        type="submit"
        className="w-full bg-green-500 hover:bg-green-600"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Registrieren...
          </div>
        ) : (
          'Registrieren'
        )}
      </Button>
    </form>
  );
};

export default RegisterForm;
