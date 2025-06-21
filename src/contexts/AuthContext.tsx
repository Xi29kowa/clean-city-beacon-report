
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthUser, AuthContextType, AuthProviderProps } from '@/types/auth';
import { getUserSession, clearUserSession } from '@/utils/sessionStorage';
import { useAuthOperations } from '@/hooks/useAuthOperations';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { register: registerUser, login: loginUser, loading: operationLoading } = useAuthOperations();

  useEffect(() => {
    const storedUser = getUserSession();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const register = async (username: string, email: string, password: string) => {
    return registerUser(username, email, password, setUser);
  };

  const login = async (email: string, password: string) => {
    return loginUser(email, password, setUser);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Supabase logout error:', error);
    }
    
    setUser(null);
    clearUserSession();
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoggedIn: !!user,
    loading: loading || operationLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
