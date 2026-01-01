import { test, expect } from '@playwright/test';

test('takes 10% off with the TEA10 coupon', async ({ page }) => {
  await page.goto('/cart');
  await page.getByPlaceholder('Coupon code').fill('TEA10');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByRole('status')).toHaveText('TEA10 applied: 10% off');
  await expect(page.locator('#total')).toHaveText('$12.15');
});
