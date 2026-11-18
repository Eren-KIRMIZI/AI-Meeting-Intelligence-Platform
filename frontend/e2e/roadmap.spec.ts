import { expect, test } from '@playwright/test';

test('global search finds a meeting and deep-links to it', async ({ page }) => {
  await page.goto('/search');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Global search' })
  ).toBeVisible();

  await page.getByLabel('Search the workspace').fill('weekly product sync');

  const result = page
    .getByRole('link', { name: /Weekly product sync/i })
    .first();
  await expect(result).toBeVisible();

  await result.click();
  await expect(page).toHaveURL(/\/meetings\/m-product-sync$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Weekly product sync' })
  ).toBeVisible();
});

test('calendar switches views and pre-fills a scheduled meeting', async ({
  page,
}) => {
  await page.goto('/calendar');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Calendar & scheduling' })
  ).toBeVisible();
  await expect(page.getByText('Connected calendars')).toBeVisible();
  await expect(page.getByText('Conflict detection')).toBeVisible();

  const view = page.getByRole('group', { name: 'Calendar view' });
  await view.getByRole('button', { name: 'Month' }).click();
  await expect(
    view.getByRole('button', { name: 'Month' })
  ).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Schedule meeting' }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(
    dialog.getByRole('heading', { name: 'Schedule a meeting' })
  ).toBeVisible();
  await expect(dialog.getByText('Participants')).toBeVisible();
  await expect(dialog.getByLabel('Reminder')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('integrations connect and sync from the hub', async ({ page }) => {
  await page.goto('/integrations');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Integrations hub' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Google Calendar' })
  ).toBeVisible();

  await page.getByRole('button', { name: 'Sync now' }).first().click();
  await expect(page.getByText(/synced: \d+ items/)).toBeVisible();

  await page
    .getByRole('switch', { name: 'Microsoft Teams connection' })
    .click();
  await expect(page.getByText('Microsoft Teams connected')).toBeVisible();
});

test('meeting templates open a playbook and create a reusable agenda', async ({
  page,
}) => {
  await page.goto('/templates');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Meeting templates' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 3, name: 'Weekly product sync' })
  ).toBeVisible();

  await page.getByRole('button', { name: 'View playbook' }).first().click();
  const playbook = page.getByRole('dialog');
  await expect(
    playbook.getByRole('heading', { level: 2, name: 'One-on-one' })
  ).toBeVisible();
  await expect(playbook.getByText('1. Check-in', { exact: true })).toBeVisible();
  await playbook.getByRole('button', { name: 'Close' }).first().click();
  await expect(playbook).toBeHidden();

  await page.getByRole('button', { name: 'New template' }).click();
  const createDialog = page.getByRole('dialog');
  await expect(
    createDialog.getByRole('heading', { name: 'New meeting template' })
  ).toBeVisible();
  await createDialog.getByLabel('Template name').fill('Weekly design critique');
  await createDialog.getByLabel('Phase 1 title').fill('Walkthrough');
  await createDialog
    .getByLabel('Prompts')
    .fill('What problem does this solve?');
  await createDialog.getByRole('button', { name: 'Create template' }).click();

  await expect(
    page.getByText('“Weekly design critique” template created')
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 3, name: 'Weekly design critique' })
  ).toBeVisible();
});

test('audit log filters and exports compliance evidence', async ({ page }) => {
  await page.goto('/audit');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Audit & compliance' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 3, name: 'Audit log' })
  ).toBeVisible();
  await expect(
    page.getByText('Blocked sign-in after repeated failures')
  ).toBeVisible();

  await page.getByLabel('Filter by severity').selectOption('critical');
  await expect(
    page.getByText('Blocked sign-in after repeated failures')
  ).toBeVisible();
  await expect(page.getByText('Zoom token refresh failed')).toBeHidden();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  await download;
  await expect(page.getByText('Audit log exported')).toBeVisible();
});
