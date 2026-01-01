import { test, expect } from '@playwright/test';

test('places an order for what is in the cart', async ({ page }) => {
  await page.goto('/products/teapot');
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.getByRole('status')).toHaveText('Added to your cart');

  await page.getByRole('link', { name: /Cart/ }).click();
  await expect(page.locator('#total')).toHaveText('£96.00');
  await page.getByRole('link', { name: 'Go to checkout' }).click();

  await page.getByLabel('Name').fill('Ada Lovelace');
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Address').fill('12 St James Square, London');
  await page.getByRole('button', { name: 'Place order' }).click();

  await expect(page.getByRole('heading', { name: 'Thank you' })).toBeVisible();
  await expect(page.getByText(/Order #\d+ is placed: £96\.00/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Cart (0)' })).toBeVisible();
});
