
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoggedIn: boolean;
  loading: boolean;
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

// Store user session in localStorage
const storeUserSession = (user: AuthUser) => {
  localStorage.setItem('cleancity_user', JSON.stringify(user));
  localStorage.setItem('cleancity_session_timestamp', Date.now().toString());
};

// Retrieve user session from localStorage
const getUserSession = (): AuthUser | null => {
  try {
    const storedUser = localStorage.getItem('cleancity_user');
    const timestamp = localStorage.getItem('cleancity_session_timestamp');
    
    if (storedUser && timestamp) {
      return JSON.parse(storedUser);
    }
  } catch (error) {
    console.error('Error retrieving user session:', error);
  }
  return null;
};

// Clear user session from localStorage
const clearUserSession = () => {
  localStorage.removeItem('cleancity_user');
  localStorage.removeItem('cleancity_session_timestamp');
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    console.log('🚀 Initializing auth state from localStorage...');
    
    const storedUser = getUserSession();
    if (storedUser) {
      console.log('✅ Found stored user session, restoring:', storedUser.email);
      setUser(storedUser);
    } else {
      console.log('ℹ️ No stored user session found');
    }
    
    setLoading(false);
  }, []);

  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log('📝 Starting registration for:', username, email);
    setLoading(true);

    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
      console.log('Using redirect URL:', redirectUrl);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Registration timeout - please try again')), 8000)
      );

      const registerPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          },
          emailRedirectTo: redirectUrl
        }
      });

      const result = await Promise.race([registerPromise, timeoutPromise]) as any;

      console.log('📝 Registration result:', result);

      if (result?.error) {
        console.error('❌ Registration error:', result.error);
        
        if (result.error.message?.includes('User already registered')) {
          return { 
            success: false, 
            error: 'Benutzer mit dieser E-Mail existiert bereits.' 
          };
        }
        
        return { 
          success: false, 
          error: result.error.message || 'Fehler beim Registrieren. Bitte versuchen Sie es erneut.' 
        };
      }

      if (result?.data?.user) {
        console.log('✅ Registration successful for:', username);
        
        // Check if user needs email confirmation
        if (!result.data.session) {
          console.log('📧 Email confirmation required');
          return { 
            success: true, 
            error: 'Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail-Adresse.' 
          };
        }
        
        // User is automatically logged in - store session
        const newUser: AuthUser = {
          id: result.data.user.id,
          username: username,
          email: email
        };
        
        setUser(newUser);
        storeUserSession(newUser);
        console.log('🎉 User registered and logged in automatically');
        return { success: true };
      }

      return { 
        success: false, 
        error: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.' 
      };
    } catch (error) {
      console.error('❌ Registration timeout or error:', error);
      return { 
        success: false, 
        error: 'Verbindungsproblem. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log('🔑 Starting login for:', email);
    setLoading(true);

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Login timeout - please try again')), 10000)
      );

      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password
      });

      const result = await Promise.race([loginPromise, timeoutPromise]) as any;

      if (result?.error) {
        console.error('❌ Login error:', result.error);
        
        if (result.error.message?.includes('Invalid login credentials')) {
          return { 
            success: false, 
            error: 'Ungültige Anmeldedaten.' 
          };
        }
        
        if (result.error.message?.includes('Email not confirmed')) {
          return { 
            success: false, 
            error: 'Bitte bestätigen Sie Ihre E-Mail-Adresse.' 
          };
        }
        
        return { 
          success: false, 
          error: result.error.message || 'Fehler beim Anmelden. Bitte versuchen Sie es erneut.' 
        };
      }

      if (result?.data?.user) {
        console.log('✅ Login successful:', result.data.user.email);
        
        // Fetch user profile and store session
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', result.data.user.id)
            .single();

          const loggedInUser: AuthUser = {
            id: result.data.user.id,
            username: profileData?.username || result.data.user.email?.split('@')[0] || 'User',
            email: result.data.user.email || ''
          };

          setUser(loggedInUser);
          storeUserSession(loggedInUser);
          console.log('✅ User session stored successfully');
        } catch (profileError) {
          console.log('⚠️ Profile fetch failed, using fallback data');
          const loggedInUser: AuthUser = {
            id: result.data.user.id,
            username: result.data.user.email?.split('@')[0] || 'User',
            email: result.data.user.email || ''
          };

          setUser(loggedInUser);
          storeUserSession(loggedInUser);
        }

        return { success: true };
      }

      return { 
        success: false, 
        error: 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.' 
      };
    } catch (error) {
      console.error('❌ Login timeout or error:', error);
      return { 
        success: false, 
        error: 'Verbindungsproblem. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    console.log('🚪 Logging out user...');
    
    try {
      await supabase.auth.signOut();
      console.log('✅ Supabase logout completed');
    } catch (error) {
      console.error('❌ Supabase logout error:', error);
    }
    
    // Clear state and localStorage
    setUser(null);
    clearUserSession();
    
    console.log('✅ Logout completed and session cleared');
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoggedIn: !!user,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
