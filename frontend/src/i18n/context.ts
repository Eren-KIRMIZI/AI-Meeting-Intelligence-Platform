import { createContext, useContext } from 'react';
import {
  formatDate,
  formatDateTime,
  formatDueDate,
  formatNumber,
  formatRelativeTime,
  formatTime,
  getGreeting,
} from './format';
import type { Locale } from './locale';
import {
  translateFor,
  type TranslationVars,
} from './translate';

export interface I18nContextValue {
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

export const I18nContext = createContext<I18nContextValue | null>(null);

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

export function useI18n() {
  // Components rendered in isolation (unit tests, stories) still get readable
  // English instead of throwing; the app always provides the real context.
  return useContext(I18nContext) ?? fallbackValue;
}
