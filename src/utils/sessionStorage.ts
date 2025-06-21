
import { AuthUser } from '@/types/auth';

const USER_KEY = 'cleancity_user';
const TIMESTAMP_KEY = 'cleancity_session_timestamp';

export const storeUserSession = (user: AuthUser): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
};

export const getUserSession = (): AuthUser | null => {
  try {
    const storedUser = localStorage.getItem(USER_KEY);
    const timestamp = localStorage.getItem(TIMESTAMP_KEY);
    
    if (storedUser && timestamp) {
      return JSON.parse(storedUser);
    }
  } catch (error) {
    console.error('Error retrieving user session:', error);
  }
  return null;
};

export const clearUserSession = (): void => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TIMESTAMP_KEY);
};
