export const locales = ['en', 'tr'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  tr: 'Türkçe',
};

export const localeTags: Record<Locale, string> = {
  en: 'en-US',
  tr: 'tr-TR',
};

/**
 * The active locale is mirrored outside React so pure helpers (date formatting,
 * CSV labels, chart tooltips) can follow the interface language without every
 * call site passing it through. `I18nProvider` keeps it in sync.
 */
let activeLocale: Locale = defaultLocale;

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'tr';
}

export function getActiveLocale(): Locale {
  return activeLocale;
}

export function setActiveLocale(locale: Locale) {
  activeLocale = locale;
}
