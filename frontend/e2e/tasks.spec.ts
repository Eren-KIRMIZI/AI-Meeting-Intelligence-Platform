import { expect, test } from '@playwright/test';

const taskTitle = 'E2E: prepare launch checklist';

test('creates a task, keeps it in the board and filters to it', async ({
  page,
}) => {
  await page.goto('/tasks');
  await expect(
    page.getByRole('heading', { level: 1, name: 'My Tasks' })
  ).toBeVisible();

  await page.getByRole('button', { name: 'New task' }).click();

  const dialog = page.getByRole('dialog');
  await expect(
    dialog.getByRole('heading', { name: 'Create a task' })
  ).toBeVisible();
  await dialog.getByLabel('Task title').fill(taskTitle);
  await dialog.getByRole('button', { name: 'Create task' }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText(taskTitle, { exact: true })).toBeVisible();

  // In-app navigation keeps the demo store alive, so the new task survives.
  await page.getByRole('link', { name: 'Meetings' }).first().click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Meetings' })
  ).toBeVisible();

  await page.getByRole('link', { name: 'My Tasks' }).first().click();
  await expect(page.getByText(taskTitle, { exact: true })).toBeVisible();

  await page.getByLabel('Search tasks').fill('E2E: prepare');
  await expect(page.getByText(taskTitle, { exact: true })).toBeVisible();
});
