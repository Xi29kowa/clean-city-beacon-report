
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Set up auth state listener and auto-restore session
  useEffect(() => {
    console.log('🚀 Setting up auth state listener with session restoration...');
    console.log('Environment:', {
      origin: typeof window !== 'undefined' ? window.location.origin : 'SSR',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR'
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        
        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          // Quick profile fetch with short timeout
          try {
            const profileTimeout = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Profile fetch timeout')), 2000)
            );

            const profileFetch = supabase
              .from('profiles')
              .select('username')
              .eq('id', session.user.id)
              .single();

            const result = await Promise.race([profileFetch, profileTimeout]) as any;

            if (result?.error) {
              console.log('⚠️ Using fallback user data');
              setUser({
                id: session.user.id,
                username: session.user.email?.split('@')[0] || 'User',
                email: session.user.email || ''
              });
            } else {
              setUser({
                id: session.user.id,
                username: result?.data?.username || session.user.email?.split('@')[0] || 'User',
                email: session.user.email || ''
              });
            }
          } catch (error) {
            console.log('⚠️ Profile fetch failed, using fallback');
            setUser({
              id: session.user.id,
              username: session.user.email?.split('@')[0] || 'User',
              email: session.user.email || ''
            });
          }
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // Auto-restore existing session on page load
    const checkSession = async () => {
      try {
        console.log('🔍 Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session check error:', error);
          setLoading(false);
          return;
        }

        if (session) {
          console.log('✅ Found existing session, restoring user');
          setSession(session);
          // User will be set by the auth state change event
        } else {
          console.log('ℹ️ No existing session found');
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Session restoration error:', error);
        setLoading(false);
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log('📝 Starting registration for:', username, email);
    setLoading(true);

    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
      console.log('Using redirect URL:', redirectUrl);

      // Shorter timeout for registration - 8 seconds
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
        
        // User is automatically logged in
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
    console.log('Environment check:', {
      origin: typeof window !== 'undefined' ? window.location.origin : 'SSR',
      localStorage: typeof localStorage !== 'undefined',
      navigator: typeof navigator !== 'undefined'
    });
    setLoading(true);

    try {
      // Longer timeout for production environments - 10 seconds
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
        // Session will be set automatically by onAuthStateChange
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
      // Sign out from Supabase (this will also clear localStorage automatically)
      await supabase.auth.signOut();
      console.log('✅ Supabase logout completed');
    } catch (error) {
      console.error('❌ Supabase logout error:', error);
    }
    
    // Clear state immediately
    setUser(null);
    setSession(null);
    
    console.log('✅ Logout completed');
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
