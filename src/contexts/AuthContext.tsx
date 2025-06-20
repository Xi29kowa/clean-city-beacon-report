
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

  // Load session and set up auth state listener
  useEffect(() => {
    console.log('🚀 Initializing Supabase authentication system...');

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        
        if (session?.user) {
          // Fetch user profile to get username
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

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('❌ Failed to get session:', error);
        }
        // The onAuthStateChange listener will handle the session
      } catch (error) {
        console.error('❌ Failed to initialize auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('📝 Attempting to register user:', username, email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        console.error('❌ Registration error:', error);
        
        // Handle specific error cases
        if (error.message.includes('User already registered')) {
          return { 
            success: false, 
            error: 'Benutzer mit dieser E-Mail existiert bereits.' 
          };
        }
        
        return { 
          success: false, 
          error: error.message || 'Fehler beim Registrieren. Bitte versuchen Sie es erneut.' 
        };
      }

      if (data.user) {
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
        error: 'Fehler beim Registrieren. Bitte versuchen Sie es erneut.' 
      };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔑 Attempting login for:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Login error:', error);
        
        // Handle specific error cases
        if (error.message.includes('Invalid login credentials')) {
          return { 
            success: false, 
            error: 'Ungültige Anmeldedaten.' 
          };
        }
        
        return { 
          success: false, 
          error: error.message || 'Fehler beim Anmelden. Bitte versuchen Sie es erneut.' 
        };
      }

      if (data.user) {
        console.log('✅ Login successful:', data.user.email);
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
        error: 'Fehler beim Anmelden. Bitte versuchen Sie es erneut.' 
      };
    }
  };

  const logout = async () => {
    try {
      if (user) {
        console.log('🚪 Logging out user:', user.username);
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Logout error:', error);
      } else {
        console.log('✅ Logout successful');
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
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
