import { test, expect } from '@playwright/test';

test('shows this week’s products', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Corner Shop' })).toBeVisible();
  await expect(page.getByText('Blue mug, $8.00')).toBeVisible();
});
