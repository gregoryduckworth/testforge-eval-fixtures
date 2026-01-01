import { expect, test } from '@playwright/test';

test('adds a todo to the list', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('What needs doing?').fill('Buy milk');
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.getByRole('list', { name: 'Todos' }).getByRole('listitem')).toHaveText(['Buy milk']);
  await expect(page.getByText('1 item left')).toBeVisible();
});
