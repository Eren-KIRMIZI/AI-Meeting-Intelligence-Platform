import { getActiveLocale, localeTags, type Locale } from './locale';
import { translateFor } from './translate';

function tag(locale?: Locale) {
  return localeTags[locale ?? getActiveLocale()];
}

function toDate(value: string | Date) {
  return typeof value === 'string' ? new Date(value) : value;
}

export function formatDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
  locale?: Locale
) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(tag(locale), options).format(date);
}

export function formatTime(value: string | Date, locale?: Locale) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(tag(locale), {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatDateTime(value: string | Date, locale?: Locale) {
  return `${formatDate(value, { month: 'short', day: 'numeric' }, locale)} · ${formatTime(
    value,
    locale
  )}`;
}

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
  locale?: Locale
) {
  return new Intl.NumberFormat(tag(locale), options).format(value);
}

export function formatRelativeTime(value: string | Date, locale?: Locale) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '—';
  const active = locale ?? getActiveLocale();

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) return translateFor(active, 'just now');
  if (diffMinutes < 60) {
    return translateFor(active, '{{count}}m ago', { count: diffMinutes });
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return translateFor(active, '{{count}}h ago', { count: diffHours });
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) {
    return translateFor(active, '{{count}}d ago', { count: diffDays });
  }

  return formatDate(date, { month: 'short', day: 'numeric' }, active);
}

export function formatDueDate(value: string | null, locale?: Locale) {
  const active = locale ?? getActiveLocale();
  if (!value) return translateFor(active, 'No due date');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return translateFor(active, 'No due date');

  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const startOfDue = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const diffDays = Math.round(
    (startOfDue.getTime() - startOfToday.getTime()) / 86_400_000
  );

  if (diffDays === 0) return translateFor(active, 'Today');
  if (diffDays === 1) return translateFor(active, 'Tomorrow');
  if (diffDays === -1) return translateFor(active, 'Yesterday');
  if (diffDays > 1 && diffDays < 7) {
    return formatDate(date, { weekday: 'short' }, active);
  }
  return formatDate(date, { month: 'short', day: 'numeric' }, active);
}

export function getGreeting(locale: Locale = getActiveLocale()) {
  const hour = new Date().getHours();
  if (hour < 12) return translateFor(locale, 'Good morning');
  if (hour < 18) return translateFor(locale, 'Good afternoon');
  return translateFor(locale, 'Good evening');
}
