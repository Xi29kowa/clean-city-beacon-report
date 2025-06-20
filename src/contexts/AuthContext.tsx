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

  // Load session on app start
  useEffect(() => {
    const loadSession = () => {
      try {
        const savedUser = localStorage.getItem('cleanCity_currentUser');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          console.log('Session restored for user:', parsedUser.username);
        }
      } catch (error) {
        console.error('Error loading saved session:', error);
        localStorage.removeItem('cleanCity_currentUser');
      }
    };

    loadSession();
  }, []);

  const saveUser = (userData: any) => {
    try {
      const existingUsers = JSON.parse(localStorage.getItem('cleanCity_users') || '[]');
      existingUsers.push(userData);
      localStorage.setItem('cleanCity_users', JSON.stringify(existingUsers));
      console.log('User account saved permanently:', userData.username);
    } catch (error) {
      console.error('Error saving user account:', error);
    }
  };

  const saveSession = (user: User) => {
    try {
      localStorage.setItem('cleanCity_currentUser', JSON.stringify(user));
      console.log('Session saved for user:', user.username);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get existing users
      const existingUsers = JSON.parse(localStorage.getItem('cleanCity_users') || '[]');
      
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

      // Save user account permanently
      saveUser(newUser);

      // Automatically log in the new user
      const { password: _, ...userWithoutPassword } = newUser;
      setUser(userWithoutPassword);
      saveSession(userWithoutPassword);

      console.log('User registered and logged in:', username);
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Fehler beim Registrieren. Bitte versuchen Sie es erneut.' };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const users = JSON.parse(localStorage.getItem('cleanCity_users') || '[]');
      const user = users.find((u: any) => 
        (u.email === email || u.username === email) && u.password === password
      );

      if (!user) {
        return { success: false, error: 'Ungültige Anmeldedaten.' };
      }

      // Remove password from user object before setting state
      const { password: _, ...userWithoutPassword } = user;
      setUser(userWithoutPassword);
      saveSession(userWithoutPassword);

      console.log('User logged in:', user.username);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Fehler beim Anmelden. Bitte versuchen Sie es erneut.' };
    }
  };

  const logout = () => {
    console.log('User logged out:', user?.username);
    setUser(null);
    localStorage.removeItem('cleanCity_currentUser');
    // Note: We keep the user accounts in cleanCity_users, only clear the session
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
