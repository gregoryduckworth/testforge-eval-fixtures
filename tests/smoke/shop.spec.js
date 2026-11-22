// GAPS-20261122-E4E2: TC1, TC2, TC3, TC4, TC5
// Smoke tests only read: they make GET requests and keep the cart in the browser's own cookie.
// None submits the checkout form (POST /orders), so they are safe to run against production.
import { test, expect } from '@playwright/test';
import { findProduct, formatPrice, PRODUCTS } from '../../src/catalogue.js';

function product(id) {
  const found = findProduct(id);
  if (!found) throw new Error(`The catalogue has no product "${id}"`);
  return found;
}

test('health endpoint reports the shop is up @smoke', async ({ request }) => {
  const response = await request.get('/health', { timeout: 10_000 });

  expect(response.status(), 'GET /health should answer 200 when the shop is up').toBe(200);
  expect(await response.json(), 'GET /health should report status ok').toEqual({ status: 'ok' });
});

test('catalogue lists every product with its price @smoke', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Our teaware', exact: true }), 'catalogue heading').toBeVisible();
  for (const { name, priceCents } of PRODUCTS) {
    const link = page.getByRole('link', { name, exact: true });
    await expect(link, `catalogue should link to "${name}"`).toBeVisible();
    const item = page.getByRole('listitem').filter({ has: link });
    await expect(
      item.getByText(formatPrice(priceCents), { exact: true }),
      `catalogue should show the price of "${name}"`,
    ).toBeVisible();
  }
});

test('product page opens from the catalogue with its price and Add to cart @smoke', async ({ page }) => {
  const teapot = product('teapot');
  await page.goto('/');

  await page.getByRole('link', { name: teapot.name, exact: true }).click();

  await expect(page, 'catalogue link should open the product page').toHaveURL(`/products/${teapot.id}`);
  await expect(page.getByRole('heading', { name: teapot.name, exact: true }), 'product heading').toBeVisible();
  await expect(page.getByText(formatPrice(teapot.priceCents), { exact: true }), 'product price').toBeVisible();
  await expect(page.getByRole('button', { name: 'Add to cart', exact: true }), 'Add to cart button').toBeVisible();
});

test('cart shows a product added from its page with the total @smoke', async ({ page }) => {
  const teapot = product('teapot');
  await page.goto(`/products/${teapot.id}`);

  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await expect(page.getByRole('status'), 'adding to the cart should confirm it').toHaveText('Added to your cart');
  await page.getByRole('link', { name: 'Cart (1)', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Your cart', exact: true }), 'cart page heading').toBeVisible();
  const row = page.getByRole('row').filter({ has: page.getByRole('cell', { name: teapot.name, exact: true }) });
  await expect(row.getByRole('cell', { name: '1', exact: true }), 'cart should hold one teapot').toBeVisible();
  await expect(
    page.getByText(`Total: ${formatPrice(teapot.priceCents)}`, { exact: true }),
    'cart total should be the teapot price',
  ).toBeVisible();
});

test('checkout page shows the order form for a filled cart @smoke', async ({ page }) => {
  const mugs = product('mugs');
  await page.goto(`/products/${mugs.id}`);
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await expect(page.getByRole('status'), 'adding to the cart should confirm it').toHaveText('Added to your cart');

  await page.goto('/cart');
  await page.getByRole('link', { name: 'Go to checkout', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Checkout', exact: true }), 'checkout heading').toBeVisible();
  await expect(
    page.getByText(`Total: ${formatPrice(mugs.priceCents)}`, { exact: true }),
    'checkout total should be the mugs price',
  ).toBeVisible();
  await expect(page.getByLabel('Name', { exact: true }), 'checkout Name field').toBeVisible();
  await expect(page.getByLabel('Email', { exact: true }), 'checkout Email field').toBeVisible();
  await expect(page.getByLabel('Address', { exact: true }), 'checkout Address field').toBeVisible();
  // The order is never placed: submitting would write an order on the server.
  await expect(page.getByRole('button', { name: 'Place order', exact: true }), 'Place order button').toBeVisible();
});
