
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  const [loading, setLoading] = useState(true);

  // Load session from localStorage on app start
  useEffect(() => {
    console.log('🚀 Initializing localStorage authentication system...');
    
    try {
      const session = localStorage.getItem('cleanCitySession');
      if (session) {
        const userData = JSON.parse(session);
        console.log('✅ Found existing session for:', userData.username);
        setUser(userData);
      } else {
        console.log('📝 No existing session found');
      }
    } catch (error) {
      console.error('❌ Failed to load session:', error);
      localStorage.removeItem('cleanCitySession');
    }
    
    setLoading(false);
  }, []);

  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log('📝 Attempting to register user:', username, email);
    
    try {
      // Get existing users
      const users = JSON.parse(localStorage.getItem('cleanCityUsers') || '[]');
      
      // Check if user already exists
      const existingUser = users.find((u: any) => u.email === email || u.username === username);
      if (existingUser) {
        return { 
          success: false, 
          error: 'Benutzer mit dieser E-Mail oder diesem Benutzernamen existiert bereits.' 
        };
      }
      
      // Create new user
      const newUser = {
        id: crypto.randomUUID(),
        username,
        email,
        password
      };
      
      // Save to users list
      users.push(newUser);
      localStorage.setItem('cleanCityUsers', JSON.stringify(users));
      
      // Auto-login the new user
      const authUser = { id: newUser.id, username, email };
      localStorage.setItem('cleanCitySession', JSON.stringify(authUser));
      setUser(authUser);
      
      console.log('✅ Registration successful:', username);
      return { success: true };
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { 
        success: false, 
        error: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.' 
      };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log('🔑 Attempting fast login for:', email);
    
    try {
      // Get users from localStorage
      const users = JSON.parse(localStorage.getItem('cleanCityUsers') || '[]');
      
      // Find matching user (allow login with email or username)
      const foundUser = users.find((u: any) => 
        (u.email === email || u.username === email) && u.password === password
      );
      
      if (foundUser) {
        // Create auth user object (without password)
        const authUser = {
          id: foundUser.id,
          username: foundUser.username,
          email: foundUser.email
        };
        
        // Save session
        localStorage.setItem('cleanCitySession', JSON.stringify(authUser));
        setUser(authUser);
        
        console.log('✅ Fast login successful:', foundUser.username);
        return { success: true };
      } else {
        console.log('❌ Invalid credentials for:', email);
        return { 
          success: false, 
          error: 'Ungültige Anmeldedaten.' 
        };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        error: 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.' 
      };
    }
  };

  const logout = () => {
    console.log('🚪 Logging out user:', user?.username);
    localStorage.removeItem('cleanCitySession');
    setUser(null);
    console.log('✅ Logout successful');
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
