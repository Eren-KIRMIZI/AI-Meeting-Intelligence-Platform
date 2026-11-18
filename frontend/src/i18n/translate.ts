import { getActiveLocale, type Locale } from './locale';
import { tr } from './messages/tr';

export type TranslationVars = Record<string, string | number>;

/**
 * English source strings are the keys. That keeps migration mechanical: an
 * unmigrated string still renders as English, and the Turkish dictionary only
 * has to describe the strings that actually exist in the interface.
 */
export function translateFor(
  locale: Locale,
  key: string,
  vars?: TranslationVars
): string {
  const template = locale === 'tr' ? tr[key] ?? key : key;
  return interpolate(template, vars);
}

export function translate(key: string, vars?: TranslationVars): string {
  return translateFor(getActiveLocale(), key, vars);
}

/**
 * Picks the singular or plural English key, then translates it. Turkish uses
 * the same noun form after a number, so both keys can share one translation.
 */
export function plural(
  count: number,
  singular: string,
  pluralKey: string,
  vars?: TranslationVars
): string {
  return translate(count === 1 ? singular : pluralKey, { count, ...vars });
}

function interpolate(template: string, vars?: TranslationVars) {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match
  );
}
