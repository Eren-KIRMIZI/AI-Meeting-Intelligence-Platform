import { expect, test } from '@playwright/test';

test.describe('mobile workspace', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('opens the navigation drawer and moves between modules', async ({
    page,
  }) => {
    await page.goto('/overview');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /Good (morning|afternoon|evening), Ayşe/,
      })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Open navigation' }).click();

    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await expect(
      drawer.getByRole('heading', { name: 'Workspace navigation' })
    ).toBeVisible();

    await drawer.getByRole('link', { name: 'Decisions' }).click();

    await expect(
      page.getByRole('heading', { level: 1, name: 'Decisions' })
    ).toBeVisible();
    await expect(page).toHaveTitle('Decisions — Nova');
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});
