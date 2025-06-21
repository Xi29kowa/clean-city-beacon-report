
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthUser } from '@/types/auth';
import { storeUserSession } from '@/utils/sessionStorage';

export const useAuthOperations = () => {
  const [loading, setLoading] = useState(false);

  const register = async (
    username: string, 
    email: string, 
    password: string,
    setUser: (user: AuthUser | null) => void
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Registration timeout - please try again')), 8000)
      );

      const registerPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: redirectUrl
        }
      });

      const result = await Promise.race([registerPromise, timeoutPromise]) as any;

      if (result?.error) {
        if (result.error.message?.includes('User already registered')) {
          return { success: false, error: 'Benutzer mit dieser E-Mail existiert bereits.' };
        }
        return { success: false, error: result.error.message || 'Fehler beim Registrieren. Bitte versuchen Sie es erneut.' };
      }

      if (result?.data?.user) {
        if (!result.data.session) {
          return { success: true, error: 'Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail-Adresse.' };
        }
        
        const newUser: AuthUser = {
          id: result.data.user.id,
          username: username,
          email: email
        };
        
        setUser(newUser);
        storeUserSession(newUser);
        return { success: true };
      }

      return { success: false, error: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.' };
    } catch (error) {
      return { success: false, error: 'Verbindungsproblem. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.' };
    } finally {
      setLoading(false);
    }
  };

  const login = async (
    email: string, 
    password: string,
    setUser: (user: AuthUser | null) => void
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Login timeout - please try again')), 10000)
      );

      const loginPromise = supabase.auth.signInWithPassword({ email, password });
      const result = await Promise.race([loginPromise, timeoutPromise]) as any;

      if (result?.error) {
        if (result.error.message?.includes('Invalid login credentials')) {
          return { success: false, error: 'Ungültige Anmeldedaten.' };
        }
        if (result.error.message?.includes('Email not confirmed')) {
          return { success: false, error: 'Bitte bestätigen Sie Ihre E-Mail-Adresse.' };
        }
        return { success: false, error: result.error.message || 'Fehler beim Anmelden. Bitte versuchen Sie es erneut.' };
      }

      if (result?.data?.user) {
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
        } catch (profileError) {
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

      return { success: false, error: 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.' };
    } catch (error) {
      return { success: false, error: 'Verbindungsproblem. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.' };
    } finally {
      setLoading(false);
    }
  };

  return { register, login, loading };
};
