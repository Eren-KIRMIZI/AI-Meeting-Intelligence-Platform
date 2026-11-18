import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
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
import { setActiveLocale, type Locale } from './locale';
import { plural, translate, translateFor, type TranslationVars } from './translate';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: TranslationVars) => string;
  plural: (
    count: number,
    singular: string,
    pluralKey: string,
    vars?: TranslationVars
  ) => string;
  formatDate: typeof formatDate;
  formatTime: typeof formatTime;
  formatDateTime: typeof formatDateTime;
  formatNumber: typeof formatNumber;
  formatRelativeTime: typeof formatRelativeTime;
  formatDueDate: typeof formatDueDate;
  getGreeting: typeof getGreeting;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const fallbackValue: I18nContextValue = {
  locale: 'en',
  setLocale: () => {},
  // Components rendered without the provider (unit tests, stories) always get
  // English, even if another test has changed the module-level active locale.
  t: (key, vars) => translateFor('en', key, vars),
  plural: (count, singular, pluralKey, vars) =>
    translateFor('en', count === 1 ? singular : pluralKey, {
      count,
      ...vars,
    }),
  formatDate: (value, options) => formatDate(value, options, 'en'),
  formatTime: (value) => formatTime(value, 'en'),
  formatDateTime: (value) => formatDateTime(value, 'en'),
  formatNumber: (value, options) => formatNumber(value, options, 'en'),
  formatRelativeTime: (value) => formatRelativeTime(value, 'en'),
  formatDueDate: (value) => formatDueDate(value, 'en'),
  getGreeting: () => getGreeting('en'),
};

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

export function useI18n() {
  // Components rendered in isolation (unit tests, stories) still get readable
  // English instead of throwing; the app always provides the real context.
  return useContext(I18nContext) ?? fallbackValue;
}

export { translate as t, plural, translateFor };
export { formatDate, formatDateTime, formatDueDate, formatNumber, formatRelativeTime, formatTime, getGreeting } from './format';
export {
  defaultLocale,
  getActiveLocale,
  isLocale,
  localeLabels,
  localeTags,
  locales,
  setActiveLocale,
  type Locale,
} from './locale';
