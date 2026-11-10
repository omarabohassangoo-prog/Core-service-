import React, { createContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, AuthSession } from '../types';
import { authApi } from '../api/auth.api';

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (session: AuthSession) => void;
  logout: () => Promise<void>;
  updateUserData: (updatedUser: Partial<AuthUser>) => void;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: async () => {},
  updateUserData: () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await authApi.me();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('auth_user', JSON.stringify(res.data));
      } else {
        setUser(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('auth_user');
      }
    } catch {
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = useCallback((session: AuthSession) => {
    localStorage.setItem('access_token', session.accessToken);
    localStorage.setItem('refresh_token', session.refreshToken);
    localStorage.setItem('auth_user', JSON.stringify(session.user));
    setUser(session.user);
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem('refresh_token') || undefined;
    try {
      await authApi.logout(token);
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth_user');
      setUser(null);
      window.location.href = '/login';
    }
  }, []);

  const updateUserData = useCallback((updated: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updated };
      localStorage.setItem('auth_user', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUserData,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
