import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@swastyasetu/shared';
import { apiRequest } from '../lib/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  facilityId?: string | null;
  facility?: {
    id: string;
    code: string;
    name: string;
    type: string;
    district: string;
  } | null;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    facilityId?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  getDefaultDashboard: (role?: UserRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function getDefaultDashboard(role?: UserRole): string {
  switch (role) {
    case 'PHC_USER':
      return '/phc';
    case 'CLINICIAN':
      return '/hospital';
    case 'REFERRAL_COORDINATOR':
      return '/triage';
    case 'ADMIN':
      return '/admin';
    default:
      return '/login';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('swastyasetu_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleOAuthSync = async (email: string, name?: string) => {
    try {
      const res = await apiRequest<{ user: UserProfile; token: string }>('/auth/oauth-sync', {
        method: 'POST',
        body: JSON.stringify({ email, name }),
      });

      if (res.success && res.data) {
        localStorage.setItem('swastyasetu_auth_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return true;
      }
    } catch (err) {
      console.error('[OAuth Sync Failed]', err);
    }
    return false;
  };

  // Validate session on mount and handle Supabase OAuth return
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      // 1. Check if Supabase has an active session from Google OAuth
      try {
        const { supabase } = await import('../lib/supabaseClient');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          const ok = await handleOAuthSync(
            session.user.email,
            session.user.user_metadata?.full_name || session.user.email
          );
          if (ok && isMounted) {
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('[Supabase OAuth Detection Error]', err);
      }

      // 2. Check existing local storage JWT
      const storedToken = localStorage.getItem('swastyasetu_auth_token');
      if (storedToken) {
        const res = await apiRequest<UserProfile>('/auth/me');
        if (isMounted) {
          if (res.success && res.data) {
            setUser(res.data);
          } else {
            localStorage.removeItem('swastyasetu_auth_token');
            setToken(null);
            setUser(null);
          }
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    }

    initAuth();

    // 3. Listen to Supabase Auth state changes (triggers on OAuth redirect)
    let unsubscribe = () => {};
    import('../lib/supabaseClient').then(({ supabase }) => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user?.email) {
          await handleOAuthSync(
            session.user.email,
            session.user.user_metadata?.full_name || session.user.email
          );
          if (isMounted) setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          if (isMounted) {
            localStorage.removeItem('swastyasetu_auth_token');
            setToken(null);
            setUser(null);
            setIsLoading(false);
          }
        }
      });
      unsubscribe = () => subscription.unsubscribe();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const res = await apiRequest<{ user: UserProfile; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setIsLoading(false);
    if (res.success && res.data) {
      localStorage.setItem('swastyasetu_auth_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true };
    }

    return {
      success: false,
      error: res.error?.message || 'Login failed. Please check credentials.',
    };
  };

  const signup = async (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    facilityId?: string;
  }) => {
    setIsLoading(true);
    const res = await apiRequest<{ user: UserProfile; token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    setIsLoading(false);
    if (res.success && res.data) {
      localStorage.setItem('swastyasetu_auth_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true };
    }

    return {
      success: false,
      error: res.error?.message || 'Registration failed.',
    };
  };

  const logout = () => {
    localStorage.removeItem('swastyasetu_auth_token');
    setToken(null);
    setUser(null);
    import('../lib/supabaseClient').then(({ supabase }) => {
      supabase.auth.signOut().catch(() => {});
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        signup,
        logout,
        getDefaultDashboard,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
