import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { TRANSLATIONS, DEFAULT_LOCALE } from '../i18n/translations';

const LocaleContext = createContext(null);
const STORAGE_KEY = 'worker-transport-locale';

function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (match, key) => (
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match
  ));
}

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored && TRANSLATIONS[stored] ? stored : DEFAULT_LOCALE;
    } catch {
      return DEFAULT_LOCALE;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* storage unavailable — preference just won't persist across reloads */
    }
  }, [locale]);

  const t = useMemo(() => {
    const dict = TRANSLATIONS[locale] || TRANSLATIONS[DEFAULT_LOCALE];
    const fallback = TRANSLATIONS[DEFAULT_LOCALE];
    return (key, vars) => {
      const raw = dict[key] ?? fallback[key] ?? key;
      return interpolate(raw, vars);
    };
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within a LocaleProvider');
  return ctx;
}