import { expect, test } from '@playwright/test';
import { trackConsoleErrors } from './helpers';

interface RouteCheck {
  path: string;
  heading: string | RegExp;
  title: string;
}

/**
 * The sweep is grouped so the suite can run the groups in parallel. A single
 * test visiting every route exceeds the default 30s budget on CI, where the
 * dev server transforms each lazily loaded page chunk on first request.
 */
const routeGroups: Array<{ name: string; routes: RouteCheck[] }> = [
  {
    name: 'core workspace',
    routes: [
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
        path: '/templates',
        heading: 'Meeting templates',
        title: 'Templates — Nova',
      },
    ],
  },
  {
    name: 'meeting follow-through',
    routes: [
      {
        path: '/meetings/m-product-sync-past',
        heading: 'Product sync — Nov 9',
        title: 'Meeting detail — Nova',
      },
      { path: '/live', heading: 'Nova Live', title: 'Nova Live — Nova' },
      { path: '/decisions', heading: 'Decisions', title: 'Decisions — Nova' },
      { path: '/knowledge', heading: 'Knowledge', title: 'Knowledge — Nova' },
      { path: '/workflows', heading: 'Workflows', title: 'Workflows — Nova' },
    ],
  },
  {
    name: 'intelligence and administration',
    routes: [
      {
        path: '/intelligence',
        heading: 'AI Intelligence',
        title: 'AI Intelligence — Nova',
      },
      {
        path: '/org-intelligence',
        heading: 'Organizational intelligence',
        title: 'Org intelligence — Nova',
      },
      { path: '/analytics', heading: 'Analytics', title: 'Analytics — Nova' },
      { path: '/team', heading: 'Team', title: 'Team — Nova' },
      {
        path: '/audit',
        heading: 'Audit & compliance',
        title: 'Audit & compliance — Nova',
      },
      { path: '/settings', heading: 'Settings', title: 'Settings — Nova' },
    ],
  },
];

test.describe('workspace shell', () => {
  for (const group of routeGroups) {
    test(`${group.name} routes render without console errors`, async ({
      page,
    }) => {
      // Several cold page loads share one test budget, so allow room for the
      // dev server to transform each route chunk.
      test.setTimeout(90_000);
      const errors = trackConsoleErrors(page);

      for (const route of group.routes) {
        await page.goto(route.path, { waitUntil: 'domcontentloaded' });
        await expect(
          page.getByRole('heading', { level: 1, name: route.heading })
        ).toBeVisible({ timeout: 15_000 });
        await expect(page).toHaveTitle(route.title);
      }

      expect(errors).toEqual([]);
    });
  }

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
