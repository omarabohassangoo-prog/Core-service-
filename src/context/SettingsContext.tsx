import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { publicApi } from '../api/public.api';

export interface PublicSettings {
  general: Record<string, string>;
  pages: Record<string, Record<string, string>>;
  auth: Record<string, string>;
  theme: Record<string, string>;
}

const defaultSettings: PublicSettings = {
  general: {},
  pages: {},
  auth: {},
  theme: {},
};

const SettingsContext = createContext<{
  settings: PublicSettings;
  isLoading: boolean;
  refresh: () => Promise<void>;
  get: (key: string, fallback?: string) => string;
} | null>(null);

export const SettingsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [settings, setSettings] = useState<PublicSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const lastFetch = useRef(0);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await publicApi.getSettings();
      if (response.data) setSettings(response.data);
      lastFetch.current = Date.now();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const handleFocus = () => {
      if (Date.now() - lastFetch.current > 5 * 60 * 1000) void refresh();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refresh]);

  const value = useMemo(() => ({
    settings,
    isLoading,
    refresh,
    get: (key: string, fallback = '') => {
      const [scope, ...parts] = key.split('.');
      const source = scope === 'pages' ? settings.pages[parts.shift() || ''] : settings[scope as keyof PublicSettings];
      return (source as Record<string, string> | undefined)?.[parts.join('.')] ?? fallback;
    },
  }), [isLoading, refresh, settings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside SettingsProvider');
  return context;
};
