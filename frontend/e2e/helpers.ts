import type { Page } from '@playwright/test';

/**
 * Demo auth is in-memory, so every full page load starts from the same seeded
 * workspace. Tests that need mutations navigate with in-app links instead of
 * calling page.goto again.
 */
export function trackConsoleErrors(page: Page) {
  const errors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  return errors;
}
