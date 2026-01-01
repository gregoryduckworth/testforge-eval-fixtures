import { test, expect } from '@playwright/test';

// The deploy check: run against each build before it goes further (BASE_URL). Every test only
// reads: none places an order, so it is safe against production.

test('is up @smoke', async ({ request }) => {
  const response = await request.get('/health');
  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual({ status: 'ok' });
});

test('lists the catalogue @smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Our teaware' })).toBeVisible();
  await expect(page.locator('.products li')).toHaveCount(3);
});

test('shows a product with its price @smoke', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Stovetop kettle' }).click();
  await expect(page.getByRole('heading', { name: 'Stovetop kettle' })).toBeVisible();
  await expect(page.locator('.price')).toHaveText('£34.00');
});

test('adds a product to the cart @smoke', async ({ page }) => {
  await page.goto('/products/mugs');
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.getByRole('status')).toHaveText('Added to your cart');
  await page.getByRole('link', { name: 'Cart (1)' }).click();
  await expect(page.locator('#total')).toHaveText('£18.00');
});

test('shows the order total at checkout @smoke', async ({ page }) => {
  await page.goto('/products/kettle');
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await page.goto('/checkout');
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
  await expect(page.locator('#total')).toHaveText('£34.00');
  await expect(page.getByRole('button', { name: 'Place order' })).toBeEnabled();
});
