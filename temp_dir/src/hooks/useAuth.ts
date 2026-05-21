import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  userCode: string;
  accountId: string;
  accountCode: string;
}

const AUTH_STORAGE_KEY = 'feedmetrics_auth_session';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const sessionData = localStorage.getItem(AUTH_STORAGE_KEY);
      if (sessionData) {
        const parsedUser = JSON.parse(sessionData);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Fetch profile with account info
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          user_code,
          account_id,
          accounts!inner(account_code)
        `)
        .eq('email', email)
        .single();

      if (error || !profile) {
        throw new Error('Usuário não encontrado');
      }

      const authUser: AuthUser = {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        userCode: profile.user_code,
        accountId: profile.account_id,
        accountCode: (profile.accounts as any).account_code,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      setUser(authUser);
      
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };
};
