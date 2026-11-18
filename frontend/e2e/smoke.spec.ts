import { expect, test } from '@playwright/test';
import { trackConsoleErrors } from './helpers';

const routes = [
  {
    path: '/overview',
    heading: /Good (morning|afternoon|evening), Ayşe/,
    title: 'Overview — Nova',
  },
  { path: '/projects', heading: 'Projects', title: 'Projects — Nova' },
  {
    path: '/projects/p-pulse',
    heading: 'Pulse mobile app',
    title: 'Project detail — Nova',
  },
  { path: '/tasks', heading: 'My Tasks', title: 'My Tasks — Nova' },
  { path: '/meetings', heading: 'Meetings', title: 'Meetings — Nova' },
  {
    path: '/meetings/m-product-sync-past',
    heading: 'Product sync — Nov 9',
    title: 'Meeting detail — Nova',
  },
  { path: '/live', heading: 'Nova Live', title: 'Nova Live — Nova' },
  { path: '/decisions', heading: 'Decisions', title: 'Decisions — Nova' },
  { path: '/knowledge', heading: 'Knowledge', title: 'Knowledge — Nova' },
  { path: '/workflows', heading: 'Workflows', title: 'Workflows — Nova' },
  {
    path: '/intelligence',
    heading: 'AI Intelligence',
    title: 'AI Intelligence — Nova',
  },
  { path: '/analytics', heading: 'Analytics', title: 'Analytics — Nova' },
  { path: '/team', heading: 'Team', title: 'Team — Nova' },
  { path: '/settings', heading: 'Settings', title: 'Settings — Nova' },
];

test.describe('workspace shell', () => {
  test('every workspace route renders its own page without console errors', async ({
    page,
  }) => {
    const errors = trackConsoleErrors(page);

    for (const route of routes) {
      await page.goto(route.path);
      await expect(
        page.getByRole('heading', { level: 1, name: route.heading })
      ).toBeVisible();
      await expect(page).toHaveTitle(route.title);
    }

    expect(errors).toEqual([]);
  });

  test('keyboard users can skip straight to the page content', async ({
    page,
  }) => {
    await page.goto('/overview');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.keyboard.press('Tab');

    const skipLink = page.getByRole('link', { name: 'Skip to content' });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });

  test('unknown paths explain the miss and offer a way back', async ({
    page,
  }) => {
    await page.goto('/this-page-does-not-exist');

    await expect(
      page.getByRole('heading', { level: 1, name: 'This page is not on the map' })
    ).toBeVisible();
    await expect(page).toHaveTitle('Page not found — Nova');

    await page.getByRole('link', { name: 'Back to overview' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: /Good (morning|afternoon|evening), Ayşe/ })
    ).toBeVisible();
  });
});
