import { useEffect, useMemo, type ReactNode } from 'react';
import { usePreferencesStore } from '@/stores/preferences-store';
import {
  formatDate,
  formatDateTime,
  formatDueDate,
  formatNumber,
  formatRelativeTime,
  formatTime,
  getGreeting,
} from './format';
import { setActiveLocale } from './locale';
import { plural, translateFor } from './translate';
import { I18nContext, type I18nContextValue } from './context';

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = usePreferencesStore((state) => state.locale);
  const setLocale = usePreferencesStore((state) => state.setLocale);

  // Pure helpers read this synchronously, before any child renders.
  setActiveLocale(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => translateFor(locale, key, vars),
      plural,
      formatDate,
      formatTime,
      formatDateTime,
      formatNumber,
      formatRelativeTime,
      formatDueDate,
      getGreeting,
    }),
    [locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
