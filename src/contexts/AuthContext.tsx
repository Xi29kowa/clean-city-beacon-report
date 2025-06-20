
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
  const [loading, setLoading] = useState(false);

  // Set up auth state listener but DON'T auto-restore session
  useEffect(() => {
    console.log('🚀 Setting up auth state listener (no auto-login)...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        
        if (session?.user && event === 'SIGNED_IN') {
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

            if (result.error) {
              console.log('⚠️ Using fallback user data');
              setUser({
                id: session.user.id,
                username: session.user.email?.split('@')[0] || 'User',
                email: session.user.email || ''
              });
            } else {
              setUser({
                id: session.user.id,
                username: result.data.username,
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

    console.log('✅ Auth initialized - starting logged out');

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log('📝 Starting registration for:', username, email);
    setLoading(true);

    try {
      // Much shorter timeout for registration
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Registration timeout')), 5000)
      );

      const registerPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      const result = await Promise.race([registerPromise, timeoutPromise]) as any;

      if (result.error) {
        console.error('❌ Registration error:', result.error);
        
        if (result.error.message.includes('User already registered')) {
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

      if (result.data?.user) {
        console.log('✅ Registration successful:', username);
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
        error: 'Registrierung dauert zu lange. Bitte versuchen Sie es später erneut.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log('🔑 Starting login for:', email);
    setLoading(true);

    try {
      // Very short timeout - 3 seconds max
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Login timeout')), 3000)
      );

      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password
      });

      const result = await Promise.race([loginPromise, timeoutPromise]) as any;

      if (result.error) {
        console.error('❌ Login error:', result.error);
        
        if (result.error.message.includes('Invalid login credentials')) {
          return { 
            success: false, 
            error: 'Ungültige Anmeldedaten.' 
          };
        }
        
        return { 
          success: false, 
          error: result.error.message || 'Fehler beim Anmelden. Bitte versuchen Sie es erneut.' 
        };
      }

      if (result.data?.user) {
        console.log('✅ Login successful:', result.data.user.email);
        return { success: true };
      }

      return { 
        success: false, 
        error: 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.' 
      };
    } catch (error) {
      console.error('❌ Login timeout:', error);
      return { 
        success: false, 
        error: 'Anmeldung dauert zu lange. Bitte versuchen Sie es später erneut.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('🚪 Logging out user immediately...');
    
    // Immediately clear state
    setUser(null);
    setSession(null);
    
    // Attempt to sign out from Supabase in background (don't wait for it)
    supabase.auth.signOut().then(() => {
      console.log('✅ Supabase logout completed');
    }).catch((error) => {
      console.error('❌ Supabase logout error (ignored):', error);
    });
    
    console.log('✅ Logout completed immediately');
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
