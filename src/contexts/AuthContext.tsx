
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Load current user from localStorage on app start
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error loading saved user:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get existing users
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Check if user already exists
      const userExists = existingUsers.some((u: any) => u.email === email || u.username === username);
      if (userExists) {
        return { success: false, error: 'Benutzer mit dieser E-Mail oder diesem Benutzernamen existiert bereits.' };
      }

      // Create new user
      const newUser = {
        id: Date.now(),
        username,
        email,
        password // In a real app, this would be hashed
      };

      // Save to localStorage
      const updatedUsers = [...existingUsers, newUser];
      localStorage.setItem('users', JSON.stringify(updatedUsers));

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Fehler beim Registrieren. Bitte versuchen Sie es erneut.' };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => 
        (u.email === email || u.username === email) && u.password === password
      );

      if (!user) {
        return { success: false, error: 'Ungültige Anmeldedaten.' };
      }

      // Remove password from user object before setting state
      const { password: _, ...userWithoutPassword } = user;
      setUser(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Fehler beim Anmelden. Bitte versuchen Sie es erneut.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoggedIn: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
