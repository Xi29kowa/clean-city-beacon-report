
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
  const [loading, setLoading] = useState(false); // Changed from true to false to start logged out

  // Set up auth state listener but DON'T auto-restore session
  useEffect(() => {
    console.log('🚀 Setting up auth state listener (no auto-login)...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        
        if (session?.user && event === 'SIGNED_IN') {
          // Only fetch profile on actual sign in, not on session restoration
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', session.user.id)
              .single();

            if (error) {
              console.error('❌ Failed to fetch user profile:', error);
              setUser({
                id: session.user.id,
                username: session.user.email?.split('@')[0] || 'User',
                email: session.user.email || ''
              });
            } else {
              setUser({
                id: session.user.id,
                username: profile.username,
                email: session.user.email || ''
              });
            }
          } catch (error) {
            console.error('❌ Error fetching profile:', error);
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

    // DON'T check for existing session - start logged out
    console.log('✅ Auth initialized - starting logged out');

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('📝 Attempting to register user:', username, email);

      const registerResult = await Promise.race([
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username
            },
            emailRedirectTo: `${window.location.origin}/`
          }
        }),
        new Promise<{ data: null; error: { message: string } }>((_, reject) => 
          setTimeout(() => reject({ data: null, error: { message: 'Registration timeout' } }), 10000)
        )
      ]);

      if (registerResult.error) {
        console.error('❌ Registration error:', registerResult.error);
        
        if (registerResult.error.message.includes('User already registered')) {
          return { 
            success: false, 
            error: 'Benutzer mit dieser E-Mail existiert bereits.' 
          };
        }
        
        return { 
          success: false, 
          error: registerResult.error.message || 'Fehler beim Registrieren. Bitte versuchen Sie es erneut.' 
        };
      }

      if (registerResult.data?.user) {
        console.log('✅ Registration successful:', username);
        return { success: true };
      }

      return { 
        success: false, 
        error: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.' 
      };
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { 
        success: false, 
        error: 'Registrierung dauert zu lange. Bitte versuchen Sie es erneut.' 
      };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔑 Attempting login for:', email);

      const loginResult = await Promise.race([
        supabase.auth.signInWithPassword({
          email,
          password
        }),
        new Promise<{ data: null; error: { message: string } }>((_, reject) => 
          setTimeout(() => reject({ data: null, error: { message: 'Login timeout' } }), 10000)
        )
      ]);

      if (loginResult.error) {
        console.error('❌ Login error:', loginResult.error);
        
        if (loginResult.error.message.includes('Invalid login credentials')) {
          return { 
            success: false, 
            error: 'Ungültige Anmeldedaten.' 
          };
        }
        
        return { 
          success: false, 
          error: loginResult.error.message || 'Fehler beim Anmelden. Bitte versuchen Sie es erneut.' 
        };
      }

      if (loginResult.data?.user) {
        console.log('✅ Login successful:', loginResult.data.user.email);
        return { success: true };
      }

      return { 
        success: false, 
        error: 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.' 
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        error: 'Anmeldung dauert zu lange. Bitte versuchen Sie es erneut.' 
      };
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
