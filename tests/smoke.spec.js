// GAPS-20261122-4628: TC1, TC2, TC3, TC4, TC5, TC6
// Smoke tests: each only reads (GET requests, or the browser-only cart cookie) and reaches the
// shop through Playwright's baseURL, so they can run against any deployed build.
import { test, expect } from '@playwright/test';
import { formatPrice, PRODUCTS } from '../src/catalogue.js';

const product = PRODUCTS[0];
if (!product) throw new Error('The catalogue has no products to smoke-test');

/** Puts `quantity` of `product` in this test's cart cookie; nothing is sent to the server. */
async function fillCart(context, baseURL, quantity) {
  if (!baseURL) throw new Error('playwright.config.js must set use.baseURL');
  await context.addCookies([{ name: 'cart', value: encodeURIComponent(`${product.id}:${quantity}`), url: baseURL }]);
}

test('health endpoint reports the shop is up @smoke', async ({ request }) => {
  const response = await request.get('/health', { timeout: 10_000 });

  expect(response.status(), 'GET /health should answer 200 when the shop is up').toBe(200);
  expect(await response.json(), 'GET /health should report status ok').toEqual({ status: 'ok' });
});

test('catalogue lists every product with its price @smoke', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Our teaware', exact: true }), 'catalogue heading').toBeVisible();
  for (const item of PRODUCTS) {
    const link = page.getByRole('link', { name: item.name, exact: true });
    const entry = page.getByRole('listitem').filter({ has: link });
    await expect(entry.getByRole('link', { name: item.name, exact: true }), `catalogue links to ${item.name}`).toBeVisible();
    await expect(
      entry.getByText(formatPrice(item.priceCents), { exact: true }),
      `catalogue price of ${item.name}`,
    ).toBeVisible();
  }
});

test('product page shows the product and an Add to cart button @smoke', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: product.name, exact: true }).click();

  await expect(page, 'catalogue link opens the product page').toHaveURL(`/products/${encodeURIComponent(product.id)}`);
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { name: product.name, exact: true }), 'product name').toBeVisible();
  await expect(main.getByText(formatPrice(product.priceCents), { exact: true }), 'product price').toBeVisible();
  await expect(main.getByRole('button', { name: 'Add to cart', exact: true }), 'Add to cart button').toBeVisible();
});

test('adding a product updates the cart count @smoke', async ({ page }) => {
  await page.goto(`/products/${encodeURIComponent(product.id)}`);
  await expect(page.getByRole('link', { name: 'Cart (0)', exact: true }), 'cart starts empty').toBeVisible();

  // app.js only writes the cart cookie in the browser; no request reaches the server.
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();

  await expect(page.getByRole('status'), 'confirmation after Add to cart').toHaveText('Added to your cart');
  await expect(page.getByRole('link', { name: 'Cart (1)', exact: true }), 'cart count after Add to cart').toBeVisible();
});

test('cart page shows the items in the cart and their total @smoke', async ({ page, context, baseURL }) => {
  await fillCart(context, baseURL, 2);

  await page.goto('/cart');

  await expect(page.getByRole('heading', { name: 'Your cart', exact: true }), 'cart heading').toBeVisible();
  const row = page.getByRole('row').filter({ has: page.getByRole('cell', { name: product.name, exact: true }) });
  await expect(row.getByRole('cell', { name: '2', exact: true }), `quantity of ${product.name} in the cart`).toBeVisible();
  const total = formatPrice(product.priceCents * 2);
  await expect(row.getByRole('cell', { name: total, exact: true }), `line price of ${product.name}`).toBeVisible();
  await expect(page.getByText(`Total: ${total}`, { exact: true }), 'cart total').toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to checkout', exact: true }), 'link to checkout').toBeVisible();
});

test('checkout page shows the order form without placing an order @smoke', async ({ page, context, baseURL }) => {
  await fillCart(context, baseURL, 1);

  await page.goto('/checkout');

  await expect(page.getByRole('heading', { name: 'Checkout', exact: true }), 'checkout heading').toBeVisible();
  await expect(page.getByLabel('Name', { exact: true }), 'Name field').toBeEditable();
  await expect(page.getByLabel('Email', { exact: true }), 'Email field').toBeEditable();
  await expect(page.getByLabel('Address', { exact: true }), 'Address field').toBeEditable();
  // The form is never submitted: placing an order (POST /orders) writes data.
  await expect(page.getByRole('button', { name: 'Place order', exact: true }), 'Place order button').toBeEnabled();
});
