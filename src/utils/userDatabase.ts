// Permanent User Database using localStorage
interface UserRecord {
  id: number;
  username: string;
  email: string;
  password: string; // In production, this would be hashed
  createdAt: string;
}

interface UserSession {
  userId: number;
  username: string;
  email: string;
  loginTime: string;
}

class UserDatabase {
  private static DATABASE_KEY = 'cleanCityDatabase';
  private static SESSION_KEY = 'cleanCitySession';

  // Initialize database on first use
  static initializeDatabase(): void {
    try {
      const existingDatabase = localStorage.getItem(this.DATABASE_KEY);
      if (!existingDatabase) {
        localStorage.setItem(this.DATABASE_KEY, JSON.stringify([]));
        console.log('🗄️ User database initialized');
      } else {
        const users = JSON.parse(existingDatabase);
        console.log(`🗄️ Database loaded with ${users.length} users`);
      }
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      localStorage.setItem(this.DATABASE_KEY, JSON.stringify([]));
    }
  }

  // Save new user to permanent database
  static saveUser(userData: Omit<UserRecord, 'id' | 'createdAt'>): UserRecord {
    try {
      const users = this.getAllUsers();
      
      const newUser: UserRecord = {
        id: Date.now(),
        ...userData,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      localStorage.setItem(this.DATABASE_KEY, JSON.stringify(users));
      
      console.log('💾 User saved permanently:', newUser.username);
      return newUser;
    } catch (error) {
      console.error('❌ Failed to save user:', error);
      throw new Error('Failed to save user to database');
    }
  }

  // Find user by email or username for login
  static findUser(emailOrUsername: string, password: string): UserRecord | null {
    try {
      const users = this.getAllUsers();
      const user = users.find((u: UserRecord) => 
        (u.email === emailOrUsername || u.username === emailOrUsername) && 
        u.password === password
      );
      
      if (user) {
        console.log('✅ User found in database:', user.username);
      } else {
        console.log('❌ User not found or wrong password');
      }
      
      return user || null;
    } catch (error) {
      console.error('❌ Failed to find user:', error);
      return null;
    }
  }

  // Check if user exists (for registration validation)
  static userExists(email: string, username: string): boolean {
    try {
      const users = this.getAllUsers();
      return users.some((u: UserRecord) => u.email === email || u.username === username);
    } catch (error) {
      console.error('❌ Failed to check user existence:', error);
      return false;
    }
  }

  // Save current login session
  static saveSession(user: UserRecord): void {
    try {
      const session: UserSession = {
        userId: user.id,
        username: user.username,
        email: user.email,
        loginTime: new Date().toISOString()
      };

      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      console.log('🔑 Session saved for user:', user.username);
    } catch (error) {
      console.error('❌ Failed to save session:', error);
    }
  }

  // Get current session (for auto-login on page load)
  static getCurrentSession(): UserSession | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) {
        return null;
      }

      const session: UserSession = JSON.parse(sessionData);
      console.log('🔑 Session restored for user:', session.username);
      return session;
    } catch (error) {
      console.error('❌ Failed to load session:', error);
      this.clearSession(); // Clear corrupted session
      return null;
    }
  }

  // Clear session (logout but keep user in database)
  static clearSession(): void {
    try {
      const session = this.getCurrentSession();
      if (session) {
        console.log('🚪 Session cleared for user:', session.username);
      }
      localStorage.removeItem(this.SESSION_KEY);
    } catch (error) {
      console.error('❌ Failed to clear session:', error);
    }
  }

  // Get all users from database
  static getAllUsers(): UserRecord[] {
    try {
      const usersData = localStorage.getItem(this.DATABASE_KEY);
      return usersData ? JSON.parse(usersData) : [];
    } catch (error) {
      console.error('❌ Failed to load users:', error);
      return [];
    }
  }

  // Get database statistics
  static getDatabaseStats(): { totalUsers: number; lastActivity: string | null } {
    try {
      const users = this.getAllUsers();
      const session = this.getCurrentSession();
      
      return {
        totalUsers: users.length,
        lastActivity: session?.loginTime || null
      };
    } catch (error) {
      console.error('❌ Failed to get database stats:', error);
      return { totalUsers: 0, lastActivity: null };
    }
  }

  // Load and restore complete database on app startup
  static loadDatabase(): { users: UserRecord[]; currentSession: UserSession | null } {
    try {
      this.initializeDatabase();
      const users = this.getAllUsers();
      const currentSession = this.getCurrentSession();
      
      console.log(`🗄️ Database loaded: ${users.length} users, session: ${currentSession ? 'active' : 'none'}`);
      
      return { users, currentSession };
    } catch (error) {
      console.error('❌ Failed to load database:', error);
      return { users: [], currentSession: null };
    }
  }
}

export default UserDatabase;
export type { UserRecord, UserSession };
