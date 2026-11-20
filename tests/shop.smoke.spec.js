// SMOKE-20261120-3155: TC1, TC2, TC3, TC4, TC5
// Smoke tests: read-only checks of the shop's critical paths. They run against Playwright's baseURL
// (BASE_URL for a deployed build), make only GET requests and never submit an order. The cart lives in a
// browser cookie, so adding to it changes nothing on the server.
import { test, expect } from '@playwright/test';
import { formatPrice, PRODUCTS } from '../src/catalogue.js';

const teapot = PRODUCTS.find((p) => p.id === 'teapot');
if (!teapot) throw new Error('The catalogue has no teapot; the smoke tests need it');
const teapotPrice = formatPrice(teapot.priceCents);

test('health endpoint reports the shop is up @smoke', async ({ request }) => {
  const response = await request.get('/health', { timeout: 10_000 });

  expect(response.status(), 'GET /health should answer 200 when the shop is up').toBe(200);
  expect(await response.json(), 'GET /health should report status ok').toEqual({ status: 'ok' });
});

test('catalogue lists every product @smoke', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Our teaware', exact: true }), 'catalogue page heading').toBeVisible();
  for (const product of PRODUCTS) {
    await expect(
      page.getByRole('link', { name: product.name, exact: true }),
      `catalogue should link to ${product.name}`,
    ).toHaveAttribute('href', `/products/${encodeURIComponent(product.id)}`);
  }
});

test('opens a product page from the catalogue @smoke', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: teapot.name, exact: true }).click();

  await expect(page, 'product link should open the product page').toHaveURL(
    `/products/${encodeURIComponent(teapot.id)}`,
  );
  await expect(page.getByRole('heading', { name: teapot.name, exact: true }), 'product page heading').toBeVisible();
  await expect(page.getByRole('main').getByText(teapotPrice, { exact: true }), 'product price').toBeVisible();
  await expect(page.getByRole('button', { name: 'Add to cart', exact: true }), 'Add to cart button').toBeVisible();
});

test('shows a product added to the cart in the cart @smoke', async ({ page }) => {
  await page.goto(`/products/${encodeURIComponent(teapot.id)}`);

  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await expect(page.getByRole('status'), 'add-to-cart confirmation').toHaveText('Added to your cart');
  await page.getByRole('link', { name: 'Cart (1)', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Your cart', exact: true }), 'cart page heading').toBeVisible();
  const line = page.getByRole('row').filter({ has: page.getByRole('cell', { name: teapot.name, exact: true }) });
  await expect(line.getByRole('cell', { name: '1', exact: true }), 'cart line quantity').toBeVisible();
  await expect(line.getByRole('cell', { name: teapotPrice, exact: true }), 'cart line price').toBeVisible();
  await expect(page.getByRole('main').getByText(`Total: ${teapotPrice}`, { exact: true }), 'cart total').toBeVisible();
});

test('shows the order form at checkout @smoke', async ({ page }) => {
  await page.goto(`/products/${encodeURIComponent(teapot.id)}`);
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Cart (1)', exact: true }), 'cart count after adding').toBeVisible();
  await page.goto('/cart');

  await page.getByRole('link', { name: 'Go to checkout', exact: true }).click();

  // The form is only looked at, never submitted: placing an order would write to the server.
  await expect(page.getByRole('heading', { name: 'Checkout', exact: true }), 'checkout page heading').toBeVisible();
  await expect(page.getByLabel('Name', { exact: true }), 'name field').toBeVisible();
  await expect(page.getByLabel('Email', { exact: true }), 'email field').toBeVisible();
  await expect(page.getByLabel('Address', { exact: true }), 'address field').toBeVisible();
  await expect(page.getByRole('button', { name: 'Place order', exact: true }), 'Place order button').toBeVisible();
});
