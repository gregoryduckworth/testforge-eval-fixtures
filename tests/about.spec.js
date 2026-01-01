import { test, expect } from '@playwright/test';

test('tells the shop’s story', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { name: 'About us' })).toBeVisible();
});
