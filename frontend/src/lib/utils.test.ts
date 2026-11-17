import { describe, expect, it, vi } from 'vitest';
import {
  avatarColorFor,
  copyToClipboard,
  downloadCsv,
  formatDueDate,
  getGreeting,
  getInitials,
  hashString,
  isOverdue,
  percentage,
} from './utils';

describe('getInitials', () => {
  it('uses the first and last name', () => {
    expect(getInitials('Ayşe Yılmaz')).toBe('AY');
  });

  it('handles single names and extra whitespace', () => {
    expect(getInitials('  Nova  ')).toBe('NO');
    expect(getInitials('Sarah  van  Chen')).toBe('SC');
  });

  it('falls back when the name is empty', () => {
    expect(getInitials('   ')).toBe('NA');
  });
});

describe('percentage', () => {
  it('rounds to the nearest whole percent', () => {
    expect(percentage(1, 3)).toBe(33);
    expect(percentage(3, 4)).toBe(75);
  });

  it('never divides by zero', () => {
    expect(percentage(5, 0)).toBe(0);
    expect(percentage(0, 0)).toBe(0);
  });
});

describe('isOverdue', () => {
  it('compares the due date against now', () => {
    expect(isOverdue(new Date(Date.now() - 60_000).toISOString())).toBe(true);
    expect(isOverdue(new Date(Date.now() + 60_000).toISOString())).toBe(false);
  });

  it('treats a missing date as not overdue', () => {
    expect(isOverdue(null)).toBe(false);
  });
});

describe('formatDueDate', () => {
  it('labels today, tomorrow and yesterday', () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    expect(formatDueDate(today.toISOString())).toBe('Today');
    expect(formatDueDate(tomorrow.toISOString())).toBe('Tomorrow');
    expect(formatDueDate(yesterday.toISOString())).toBe('Yesterday');
  });

  it('falls back for missing or invalid dates', () => {
    expect(formatDueDate(null)).toBe('No due date');
    expect(formatDueDate('not-a-date')).toBe('No due date');
  });
});

describe('getGreeting', () => {
  it('matches the current time of day', () => {
    const hour = new Date().getHours();
    const greeting = getGreeting();

    if (hour < 12) expect(greeting).toBe('Good morning');
    else if (hour < 18) expect(greeting).toBe('Good afternoon');
    else expect(greeting).toBe('Good evening');
  });
});

describe('avatar helpers', () => {
  it('produces stable hashes and palette colors', () => {
    expect(hashString('nova')).toBe(hashString('nova'));
    expect(hashString('nova')).not.toBe(hashString('meeting'));
    expect(avatarColorFor('nova')).toMatch(/^#[0-9A-F]{6}$/i);
    expect(avatarColorFor('nova')).toBe(avatarColorFor('nova'));
  });
});

describe('downloadCsv', () => {
  it('creates and clicks a CSV download', () => {
    const createObjectUrl = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:nova');
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    downloadCsv('tasks.csv', [
      { title: 'Ship brief', status: 'done' },
      { title: 'QA flow', status: 'todo' },
    ]);

    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    const blob = createObjectUrl.mock.calls[0][0] as Blob;
    expect(blob.type).toContain('text/csv');
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:nova');
  });

  it('does nothing when there are no rows', () => {
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL');

    downloadCsv('empty.csv', []);

    expect(createObjectUrl).not.toHaveBeenCalled();
  });
});

describe('copyToClipboard', () => {
  function stubClipboard(writeText: () => Promise<void>) {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
  }

  function stubExecCommand(copied: boolean) {
    const execCommand = vi.fn().mockReturnValue(copied);
    Object.defineProperty(document, 'execCommand', {
      value: execCommand,
      configurable: true,
    });
    return execCommand;
  }

  it('uses the async clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    await expect(copyToClipboard('hello')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('falls back to a hidden textarea when the clipboard is denied', async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    const execCommand = stubExecCommand(true);

    await expect(copyToClipboard('hello')).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('reports failure when both paths fail', async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    stubExecCommand(false);

    await expect(copyToClipboard('hello')).resolves.toBe(false);
  });
});
