import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import UserDatabase, { UserRecord } from '@/utils/userDatabase';

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

  // Load session and database on app start
  useEffect(() => {
    const initializeAuth = () => {
      try {
        console.log('🚀 Initializing authentication system...');
        
        // Load database and check for existing session
        const { currentSession } = UserDatabase.loadDatabase();
        
        if (currentSession) {
          // Convert session to user object
          const restoredUser: User = {
            id: currentSession.userId,
            username: currentSession.username,
            email: currentSession.email
          };
          
          setUser(restoredUser);
          console.log('✅ Auto-login successful for user:', restoredUser.username);
          
          // Log session info
          const timeSinceLogin = new Date().getTime() - new Date(currentSession.loginTime).getTime();
          const hoursSinceLogin = Math.floor(timeSinceLogin / (1000 * 60 * 60));
          console.log(`🕐 User was logged in ${hoursSinceLogin} hours ago`);
        } else {
          console.log('ℹ️ No existing session found');
        }

        // Log database stats
        const stats = UserDatabase.getDatabaseStats();
        console.log(`📊 Database stats: ${stats.totalUsers} total users registered`);
        
      } catch (error) {
        console.error('❌ Failed to initialize auth:', error);
      }
    };

    initializeAuth();
  }, []);

  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('📝 Attempting to register user:', username);

      // Check if user already exists
      if (UserDatabase.userExists(email, username)) {
        return { 
          success: false, 
          error: 'Benutzer mit dieser E-Mail oder diesem Benutzernamen existiert bereits.' 
        };
      }

      // Save user to permanent database
      const newUser = UserDatabase.saveUser({
        username,
        email,
        password // In production, this would be hashed
      });

      // Create user object without password
      const userWithoutPassword: User = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      };

      // Set current user and save session
      setUser(userWithoutPassword);
      UserDatabase.saveSession(newUser);

      console.log('✅ Registration and auto-login successful:', username);
      return { success: true };
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { 
        success: false, 
        error: 'Fehler beim Registrieren. Bitte versuchen Sie es erneut.' 
      };
    }
  };

  const login = async (emailOrUsername: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔑 Attempting login for:', emailOrUsername);

      // Find user in permanent database
      const foundUser = UserDatabase.findUser(emailOrUsername, password);

      if (!foundUser) {
        return { 
          success: false, 
          error: 'Ungültige Anmeldedaten.' 
        };
      }

      // Create user object without password
      const userWithoutPassword: User = {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email
      };

      // Set current user and save session
      setUser(userWithoutPassword);
      UserDatabase.saveSession(foundUser);

      console.log('✅ Login successful:', foundUser.username);
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        error: 'Fehler beim Anmelden. Bitte versuchen Sie es erneut.' 
      };
    }
  };

  const logout = () => {
    try {
      if (user) {
        console.log('🚪 Logging out user:', user.username);
      }
      
      // Clear session but keep user in database
      UserDatabase.clearSession();
      setUser(null);
      
      console.log('✅ Logout successful - user account remains in database');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
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
