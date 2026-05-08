'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { messages, Locale, Messages } from './i18n';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  walletBalance: number;
  totalSpent: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

interface LangContextType {
  locale: Locale;
  t: Messages;
  setLocale: (l: Locale) => void;
  dir: 'rtl' | 'ltr';
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

const LangContext = createContext<LangContextType>({
  locale: 'ar',
  t: messages.ar,
  setLocale: () => {},
  dir: 'rtl',
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/login';
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ar');

  useEffect(() => {
    const saved = localStorage.getItem('hatm_lang') as Locale;
    if (saved === 'ar' || saved === 'en') setLocaleState(saved);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('hatm_lang', l);
  };

  return (
    <LangContext.Provider value={{
      locale,
      t: messages[locale],
      setLocale,
      dir: locale === 'ar' ? 'rtl' : 'ltr',
    }}>
      {children}
    </LangContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export const useLang = () => useContext(LangContext);
