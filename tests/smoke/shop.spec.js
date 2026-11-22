// GAPS-20261122-BDE7: TC1, TC2, TC3, TC4, TC5
// Smoke tests: each only reads, so they can run against any deployed build (set BASE_URL).
// Adding to the cart writes only the browser's cart cookie; no test places an order.
import { test, expect } from '@playwright/test';
import { findProduct, formatPrice, PRODUCTS } from '../../src/catalogue.js';

const teapot = findProduct('teapot');
const mugs = findProduct('mugs');

test('health check reports the shop is up @smoke', async ({ request }) => {
  const response = await request.get('/health', { timeout: 10_000 });

  expect(response.status(), 'GET /health should answer 200: the shop is not up').toBe(200);
  expect(await response.json(), 'GET /health should report status ok').toEqual({ status: 'ok' });
});

test('catalogue lists every product with its price @smoke', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Our teaware', exact: true }), 'catalogue heading').toBeVisible();
  for (const product of PRODUCTS) {
    const link = page.getByRole('link', { name: product.name, exact: true });
    await expect(link, `catalogue should link to ${product.name}`).toHaveAttribute('href', `/products/${product.id}`);
    const item = page.getByRole('listitem').filter({ has: link });
    await expect(
      item.getByText(formatPrice(product.priceCents), { exact: true }),
      `catalogue should show the price of ${product.name}`,
    ).toBeVisible();
  }
});

test('opens a product page from the catalogue @smoke', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: teapot.name, exact: true }).click();

  const main = page.getByRole('main');
  await expect(page, 'product link should open the product page').toHaveURL(`/products/${teapot.id}`);
  await expect(main.getByRole('heading', { name: teapot.name, exact: true }), 'product heading').toBeVisible();
  await expect(main.getByText(formatPrice(teapot.priceCents), { exact: true }), 'product price').toBeVisible();
  await expect(main.getByRole('button', { name: 'Add to cart', exact: true }), 'Add to cart button').toBeEnabled();
});

test('adds a product to the cart and shows it in the cart @smoke', async ({ page }) => {
  await page.goto(`/products/${teapot.id}`);

  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await expect(page.getByRole('status'), 'adding to the cart should confirm it').toHaveText('Added to your cart');
  await page.getByRole('link', { name: 'Cart (1)', exact: true }).click();

  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { name: 'Your cart', exact: true }), 'cart page heading').toBeVisible();
  const line = main.getByRole('row').filter({ has: page.getByRole('cell', { name: teapot.name, exact: true }) });
  await expect(line.getByRole('cell', { name: '1', exact: true }), 'cart should hold one teapot').toBeVisible();
  await expect(
    main.getByText(`Total: ${formatPrice(teapot.priceCents)}`, { exact: true }),
    'cart total should be the teapot price',
  ).toBeVisible();
});

test('opens checkout with the order form for a filled cart @smoke', async ({ page }) => {
  await page.goto(`/products/${mugs.id}`);
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await expect(page.getByRole('status'), 'adding to the cart should confirm it').toHaveText('Added to your cart');

  await page.goto('/cart');
  await page.getByRole('link', { name: 'Go to checkout', exact: true }).click();

  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { name: 'Checkout', exact: true }), 'checkout heading').toBeVisible();
  await expect(main.getByLabel('Name', { exact: true }), 'checkout name field').toBeEditable();
  await expect(main.getByLabel('Email', { exact: true }), 'checkout email field').toBeEditable();
  await expect(main.getByLabel('Address', { exact: true }), 'checkout address field').toBeEditable();
  await expect(main.getByRole('button', { name: 'Place order', exact: true }), 'Place order button').toBeEnabled();
});
