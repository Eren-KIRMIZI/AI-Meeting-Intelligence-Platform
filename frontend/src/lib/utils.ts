import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  formatDate as formatDateI18n,
  formatDateTime as formatDateTimeI18n,
  formatDueDate as formatDueDateI18n,
  formatRelativeTime as formatRelativeTimeI18n,
  formatTime as formatTimeI18n,
  getGreeting as getGreetingI18n,
} from '@/i18n/format';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const AVATAR_PALETTE = [
  '#5B8DEF',
  '#8B7CF6',
  '#3FB6A8',
  '#E0A458',
  '#E07A8B',
  '#4FA8C9',
  '#B18CD9',
  '#7FB069',
];

export function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function avatarColorFor(seed: string) {
  return AVATAR_PALETTE[hashString(seed) % AVATAR_PALETTE.length];
}

/**
 * Avatar initials sit on a 15%-alpha tint of their accent colour, so mid-tone
 * accents fall below 4.5:1. Lightening the text keeps the identity hue while
 * meeting WCAG AA on the dark surface.
 */
export function avatarTextColor(hex: string) {
  const normalized = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return hex;

  const channels = [0, 2, 4].map((index) =>
    Number.parseInt(normalized.slice(index, index + 2), 16)
  );
  const lightened = channels.map((channel) =>
    Math.round(channel + (255 - channel) * 0.3)
  );

  return `#${lightened
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`;
}

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function formatDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
) {
  return formatDateI18n(value, options);
}

export function formatTime(value: string | Date) {
  return formatTimeI18n(value);
}

export function formatDateTime(value: string | Date) {
  return formatDateTimeI18n(value);
}

export function formatRelativeTime(value: string | Date) {
  return formatRelativeTimeI18n(value);
}

export function formatDuration(durationMs: number) {
  if (!Number.isFinite(durationMs) || durationMs < 0) return '—';
  if (durationMs < 1000) return `${Math.round(durationMs)}ms`;
  if (durationMs < 60_000) return `${(durationMs / 1000).toFixed(1)}s`;

  const minutes = Math.floor(durationMs / 60_000);
  const seconds = Math.round((durationMs % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export function isOverdue(value: string | null) {
  if (!value) return false;
  return new Date(value).getTime() < Date.now();
}

export function formatDueDate(value: string | null) {
  return formatDueDateI18n(value);
}

export function getGreeting() {
  return getGreetingI18n();
}

export function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const text = value == null ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const csv = [
    headers.map(escape).join(','),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copies text using the async clipboard API and falls back to a hidden
 * textarea when the browser denies permission. Returns whether it worked so
 * callers can show an honest success or error state.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied — try the legacy path below.
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

export function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: 'application/json;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function percentage(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}
