import { test, expect } from '@playwright/test';

test('sends a message', async ({ page }) => {
  await page.goto('/contact');
  await page.getByLabel('Email').fill('sam@example.com');
  await page.getByLabel('Message').fill('Do you sell green tea?');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByRole('status')).toHaveText('Thanks, we will reply within a day.');
});
