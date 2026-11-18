import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageSwitcher } from '@/components/common/language-switcher';
import { I18nProvider, setActiveLocale, translateFor, useI18n } from '@/i18n';
import {
  formatDate,
  formatDueDate,
  formatNumber,
  formatRelativeTime,
  getGreeting,
} from '@/i18n/format';
import { usePreferencesStore } from '@/stores/preferences-store';

function Probe() {
  const { locale, t, plural, formatNumber: formatNumberForLocale } = useI18n();

  return (
    <div>
      <p data-testid="locale">{locale}</p>
      <p data-testid="workspace">{t('Workspace')}</p>
      <p data-testid="fallback">{t('A string that is not in the dictionary')}</p>
      <p data-testid="tasks">{plural(2, '{{count}} task', '{{count}} tasks')}</p>
      <p data-testid="number">{formatNumberForLocale(1234.5)}</p>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  usePreferencesStore.setState({ locale: 'en' });
  setActiveLocale('en');
  document.documentElement.lang = 'en';
});

afterEach(() => {
  vi.useRealTimers();
  setActiveLocale('en');
  usePreferencesStore.setState({ locale: 'en' });
});

describe('translateFor', () => {
  it('returns the English source string when no dictionary entry exists', () => {
    expect(translateFor('en', 'Workspace')).toBe('Workspace');
    expect(translateFor('en', 'Not translated yet')).toBe('Not translated yet');
    expect(translateFor('tr', 'Not translated yet')).toBe('Not translated yet');
  });

  it('translates known keys and interpolates variables', () => {
    expect(translateFor('tr', 'Workspace')).toBe('Çalışma Alanı');
    expect(translateFor('tr', '{{count}} task', { count: 3 })).toBe('3 görev');
    expect(translateFor('tr', 'Owner: {{owner}}', { owner: 'Ayşe' })).toBe(
      'Sahip: Ayşe'
    );
  });

  it('leaves unknown placeholders untouched', () => {
    expect(translateFor('en', 'Hello {{name}}', { other: 'x' })).toBe(
      'Hello {{name}}'
    );
  });

  it('warns once in development when a Turkish entry is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const key = 'Runtime probe without a dictionary entry';

    expect(translateFor('tr', key)).toBe(key);
    translateFor('tr', key);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain(key);
  });
});

describe('I18nProvider', () => {
  it('switches the interface, formatters and <html lang> with the locale', async () => {
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <Probe />
        <LanguageSwitcher />
      </I18nProvider>
    );

    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(screen.getByTestId('workspace')).toHaveTextContent('Workspace');
    expect(screen.getByTestId('tasks')).toHaveTextContent('2 tasks');
    expect(screen.getByTestId('number')).toHaveTextContent('1,234.5');
    expect(document.documentElement.lang).toBe('en');

    const group = screen.getByRole('group', { name: 'Language' });
    const turkish = screen.getByRole('button', { name: 'Türkçe' });
    expect(group).toBeInTheDocument();
    expect(turkish).toHaveAttribute('aria-pressed', 'false');

    await user.click(turkish);

    expect(screen.getByTestId('locale')).toHaveTextContent('tr');
    expect(screen.getByTestId('workspace')).toHaveTextContent('Çalışma Alanı');
    expect(screen.getByTestId('tasks')).toHaveTextContent('2 görev');
    expect(screen.getByTestId('number')).toHaveTextContent('1.234,5');
    expect(screen.getByTestId('fallback')).toHaveTextContent(
      'A string that is not in the dictionary'
    );
    expect(document.documentElement.lang).toBe('tr');
    expect(turkish).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'English' })
    ).toHaveAttribute('aria-pressed', 'false');
    expect(usePreferencesStore.getState().locale).toBe('tr');
  });

  it('keeps the switcher accessible in Turkish', async () => {
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <LanguageSwitcher />
      </I18nProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Türkçe' }));

    expect(screen.getByRole('group', { name: 'Dil' })).toBeInTheDocument();
    expect(
      screen.getByText('Arayüz dili', { selector: 'p' })
    ).toBeInTheDocument();
  });
});

describe('useI18n without a provider', () => {
  it('falls back to English even when another test changed the active locale', () => {
    setActiveLocale('tr');

    render(<Probe />);

    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(screen.getByTestId('workspace')).toHaveTextContent('Workspace');
    expect(screen.getByTestId('tasks')).toHaveTextContent('2 tasks');
    expect(screen.getByTestId('number')).toHaveTextContent('1,234.5');
  });
});

describe('locale-aware formatters', () => {
  it('formats numbers with the locale separators', () => {
    expect(formatNumber(1234.5, undefined, 'en')).toBe('1,234.5');
    expect(formatNumber(1234.5, undefined, 'tr')).toBe('1.234,5');
  });

  it('formats dates with the locale month names', () => {
    const date = new Date(2026, 10, 18);

    expect(formatDate(date, { month: 'short', day: 'numeric' }, 'en')).toBe(
      'Nov 18'
    );
    expect(formatDate(date, { month: 'short', day: 'numeric' }, 'tr')).toBe(
      '18 Kas'
    );
  });

  it('formats relative time and due dates in the requested locale', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 18, 12, 0, 0));

    expect(formatRelativeTime(new Date(2026, 10, 18, 11, 30, 0), 'en')).toBe(
      '30m ago'
    );
    expect(formatRelativeTime(new Date(2026, 10, 18, 11, 30, 0), 'tr')).toBe(
      '30 dk önce'
    );

    expect(formatDueDate('2026-11-18T09:00:00', 'en')).toBe('Today');
    expect(formatDueDate('2026-11-18T09:00:00', 'tr')).toBe('Bugün');
    expect(formatDueDate(null, 'tr')).toBe('Bitiş tarihi yok');
  });

  it('greets in the requested locale', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 18, 8, 0, 0));

    expect(getGreeting('en')).toBe('Good morning');
    expect(getGreeting('tr')).toBe('Günaydın');
  });
});
