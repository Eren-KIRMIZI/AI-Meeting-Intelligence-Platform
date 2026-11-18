import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const routes = [
  '/overview',
  '/projects',
  '/projects/p-pulse',
  '/tasks',
  '/meetings',
  '/meetings/m-product-sync-past',
  '/calendar',
  '/templates',
  '/search',
  '/live',
  '/decisions',
  '/knowledge',
  '/workflows',
  '/integrations',
  '/intelligence',
  '/analytics',
  '/team',
  '/audit',
  '/settings',
];

interface ViolationSummary {
  id: string;
  impact: string | null | undefined;
  help: string;
  count: number;
  nodes: Array<{ target: unknown; summary: string | undefined }>;
}

async function settle(page: Page) {
  await page.evaluate(async () => {
    await Promise.all(
      document.getAnimations().map((animation) => animation.finished.catch(() => undefined))
    );
  });
}

async function audit(page: Page, context: string) {
  await settle(page);
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

  const summary: ViolationSummary[] = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    count: violation.nodes.length,
    nodes: violation.nodes.slice(0, 3).map((node) => ({
      target: node.target,
      summary: node.failureSummary?.split('\n').slice(0, 3).join(' | '),
    })),
  }));

  if (summary.length) {
    console.log(`A11Y ${context} ${JSON.stringify(summary)}`);
  }
  expect(summary, `axe violations on ${context}`).toEqual([]);
}

test.describe('accessibility audit', () => {
  for (const route of routes) {
    test(`audit ${route}`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
        timeout: 20_000,
      });

      await audit(page, route);
    });
  }

  test('audit insight detail dialog', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/intelligence?insight=ins-01', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 20_000 });

    await audit(page, '/intelligence?insight=ins-01');
  });

  test('audit create task dialog', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/tasks', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'New task' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await audit(page, '/tasks#create');
  });

  test('audit command palette', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/overview', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 20_000,
    });

    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(
      page.getByRole('combobox', { name: 'Search workspace' })
    ).toBeVisible();

    await audit(page, 'command palette');
  });

  test('audit notifications menu', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/overview', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 20_000,
    });

    await page.getByRole('button', { name: /^Notifications/ }).click();
    await expect(
      page.getByRole('dialog', { name: 'Notifications' })
    ).toBeVisible();

    await audit(page, 'notifications menu');
  });

  test('audit user menu', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/overview', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 20_000,
    });

    await page.getByRole('button', { name: /account menu/ }).click();
    await expect(page.getByRole('menu')).toBeVisible();

    await audit(page, 'user menu');
  });

  test('keyboard focus stays visible while tabbing', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/overview', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 20_000,
    });

    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

    for (let stop = 0; stop < 8; stop += 1) {
      await page.keyboard.press('Tab');
      const state = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null;
        if (!element || element === document.body) {
          return { ok: false, label: 'body' };
        }
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const hasRing = style.boxShadow !== 'none' && style.boxShadow.trim() !== '';
        const hasOutline =
          style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0;
        return {
          ok: (hasRing || hasOutline) && rect.width > 0 && rect.height > 0,
          label:
            element.getAttribute('aria-label') ??
            element.textContent?.trim().slice(0, 40) ??
            element.tagName,
        };
      });

      expect(state.ok, `no visible focus indicator on tab stop ${stop + 1}: ${state.label}`).toBe(true);
    }
  });
});
