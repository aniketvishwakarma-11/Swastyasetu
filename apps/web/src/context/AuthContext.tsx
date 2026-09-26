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

const DEMO_FALLBACK_PROFILES: Record<string, UserProfile> = {
  'phc_doctor@swastyasetu.gov.in': {
    id: 'user-phc-khed',
    name: 'Dr. Rajesh Sharma',
    email: 'phc_doctor@swastyasetu.gov.in',
    role: 'PHC_USER',
    facilityId: 'fac-phc-khed',
    facility: {
      id: 'fac-phc-khed',
      code: 'PHC-KHED',
      name: 'Primary Health Centre Khed',
      type: 'PHC',
      district: 'Pune',
    },
  },
  'hospital_doctor@swastyasetu.gov.in': {
    id: 'user-hosp-aundh',
    name: 'Dr. Priya Deshmukh',
    email: 'hospital_doctor@swastyasetu.gov.in',
    role: 'CLINICIAN',
    facilityId: 'fac-dist-hosp',
    facility: {
      id: 'fac-dist-hosp',
      code: 'DIST-HOSP',
      name: 'Aundh District Hospital',
      type: 'DISTRICT_HOSPITAL',
      district: 'Pune',
    },
  },
  'coordinator@swastyasetu.gov.in': {
    id: 'user-coord-aundh',
    name: 'Vikram Solanki',
    email: 'coordinator@swastyasetu.gov.in',
    role: 'REFERRAL_COORDINATOR',
    facilityId: 'fac-dist-hosp',
    facility: {
      id: 'fac-dist-hosp',
      code: 'DIST-HOSP',
      name: 'Aundh District Hospital',
      type: 'DISTRICT_HOSPITAL',
      district: 'Pune',
    },
  },
  'admin@swastyasetu.gov.in': {
    id: 'user-admin-pune',
    name: 'System Admin',
    email: 'admin@swastyasetu.gov.in',
    role: 'ADMIN',
    facilityId: null,
    facility: null,
  },
};

function getStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem('swastyasetu_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isNetworkOrProxyFailure(code?: string): boolean {
  return (
    code === 'NETWORK_ERROR' ||
    code === 'HTTP_500' ||
    code === 'HTTP_502' ||
    code === 'HTTP_503' ||
    code === 'HTTP_504'
  );
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(getStoredUser);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('swastyasetu_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(() => !localStorage.getItem('swastyasetu_user') && !!localStorage.getItem('swastyasetu_auth_token'));

  const handleOAuthSync = async (email: string, name?: string) => {
    try {
      const res = await apiRequest<{ user: UserProfile; token: string }>('/auth/oauth-sync', {
        method: 'POST',
        body: JSON.stringify({ email, name }),
      });

      if (res.success && res.data) {
        localStorage.setItem('swastyasetu_auth_token', res.data.token);
        localStorage.setItem('swastyasetu_user', JSON.stringify(res.data.user));
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
        // If it's an offline session token, preserve local credentials directly
        if (storedToken.startsWith('offline_demo_token_')) {
          const cachedUser = getStoredUser();
          if (cachedUser && isMounted) {
            setUser(cachedUser);
            setIsLoading(false);
            return;
          }
        }

        const res = await apiRequest<UserProfile>('/auth/me');
        if (isMounted) {
          if (res.success && res.data) {
            localStorage.setItem('swastyasetu_user', JSON.stringify(res.data));
            setUser(res.data);
          } else if (isNetworkOrProxyFailure(res.error?.code)) {
            // Keep local user cached when network or backend gateway is down instead of clearing session
            const cachedUser = getStoredUser();
            if (cachedUser) {
              setUser(cachedUser);
            }
          } else {
            // Token is explicitly invalid (e.g. 401 or revoked)
            localStorage.removeItem('swastyasetu_auth_token');
            localStorage.removeItem('swastyasetu_user');
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
            localStorage.removeItem('swastyasetu_user');
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
      localStorage.setItem('swastyasetu_user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true };
    }

    // Offline field fallback for recognized demo accounts
    if (isNetworkOrProxyFailure(res.error?.code) && DEMO_FALLBACK_PROFILES[email]) {
      const demoUser = DEMO_FALLBACK_PROFILES[email];
      const offlineToken = `offline_demo_token_${demoUser.role.toLowerCase()}`;
      localStorage.setItem('swastyasetu_auth_token', offlineToken);
      localStorage.setItem('swastyasetu_user', JSON.stringify(demoUser));
      setToken(offlineToken);
      setUser(demoUser);
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
      localStorage.setItem('swastyasetu_user', JSON.stringify(res.data.user));
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
    localStorage.removeItem('swastyasetu_user');
    setToken(null);
    setUser(null);
    import('../lib/supabaseClient').then(({ supabase }) => {
      supabase.auth.signOut().catch(() => {});
    });
    // Immediately redirect to login page so the clinician remains on /login after signout
    window.location.href = '/login';
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
