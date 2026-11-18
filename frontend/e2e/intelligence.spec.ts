import { expect, test } from '@playwright/test';

test('a deep link opens the right insight and review actions persist', async ({
  page,
}) => {
  await page.goto('/intelligence?insight=ins-01');

  const dialog = page.getByRole('dialog');
  await expect(
    dialog.getByText('Launch timing is the only repeated risk')
  ).toBeVisible();
  await expect(dialog.getByText('Risk signal')).toBeVisible();

  await dialog.getByRole('button', { name: 'Accept' }).click();
  await expect(
    dialog.getByRole('button', { name: 'Reopen' })
  ).toBeVisible();
  await expect(dialog.getByText('Accepted', { exact: true })).toBeVisible();

  await dialog.getByRole('button', { name: 'Reopen' }).click();
  await expect(
    dialog.getByRole('button', { name: 'Accept' })
  ).toBeVisible();
  await expect(dialog.getByText('Open', { exact: true })).toBeVisible();

  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
});

test('filters narrow the queue by kind and search', async ({ page }) => {
  await page.goto('/intelligence');
  await expect(
    page.getByRole('heading', { level: 1, name: 'AI Intelligence' })
  ).toBeVisible();

  await page.getByLabel('Filter by kind').selectOption('risk');
  await expect(page.getByText('2 of 8 signals')).toBeVisible();

  await page.getByLabel('Filter by kind').selectOption('all');
  await page.getByLabel('Search insights').fill('acme');
  await expect(page.getByText('2 of 8 signals')).toBeVisible();

  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(page.getByText('8 of 8 signals')).toBeVisible();
});
