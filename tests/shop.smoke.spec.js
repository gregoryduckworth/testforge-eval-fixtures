// SMOKE-20261120-9850: TC1, TC2, TC3, TC4, TC5
// Read-only smoke checks: they run against deployed builds (BASE_URL), production included, so no
// test places an order or sends anything but GET. The cart lives in a browser cookie only.
import { test, expect } from '@playwright/test';
import { findProduct, formatPrice, PRODUCTS } from '../src/catalogue.js';

const teapot = findProduct('teapot');

test('health endpoint reports the shop is up @smoke', async ({ request }) => {
  const response = await request.get('/health', { timeout: 10_000 });

  expect(response.status(), 'GET /health should answer 200').toBe(200);
  expect(response.headers()['content-type'], 'GET /health should answer JSON').toBe('application/json');
  expect(await response.json(), 'GET /health should report status ok').toEqual({ status: 'ok' });
});

test('catalogue lists every product with its price @smoke', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Our teaware', exact: true }), 'catalogue page heading').toBeVisible();
  for (const product of PRODUCTS) {
    const link = page.getByRole('link', { name: product.name, exact: true });
    await expect(link, `catalogue links to ${product.name}`).toHaveAttribute('href', `/products/${product.id}`);
    const item = page.getByRole('listitem').filter({ has: link });
    await expect(
      item.getByText(formatPrice(product.priceCents), { exact: true }),
      `catalogue shows the price of ${product.name}`,
    ).toBeVisible();
  }
});

test('opens a product page from the catalogue @smoke', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: teapot.name, exact: true }).click();

  const main = page.getByRole('main');
  await expect(page, 'product link opens the product page').toHaveURL(`/products/${teapot.id}`);
  await expect(main.getByRole('heading', { name: teapot.name, exact: true }), 'product page heading').toBeVisible();
  await expect(main.getByText(formatPrice(teapot.priceCents), { exact: true }), 'product page price').toBeVisible();
  await expect(main.getByRole('button', { name: 'Add to cart', exact: true }), 'add-to-cart button').toBeVisible();
});

test('adds a product to the cart and shows it on the cart page @smoke', async ({ page }) => {
  await page.goto(`/products/${teapot.id}`);

  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await expect(page.getByRole('status'), 'add-to-cart confirmation').toHaveText('Added to your cart');
  await page.getByRole('link', { name: 'Cart (1)', exact: true }).click();

  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { name: 'Your cart', exact: true }), 'cart page heading').toBeVisible();
  await expect(main.getByRole('cell', { name: teapot.name, exact: true }), 'cart lists the product').toBeVisible();
  await expect(
    main.getByText(`Total: ${formatPrice(teapot.priceCents)}`, { exact: true }),
    'cart shows the total',
  ).toBeVisible();
});

test('checkout page shows the order form for the cart @smoke', async ({ page }) => {
  await page.goto(`/products/${teapot.id}`);
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Cart (1)', exact: true }), 'cart count after adding').toBeVisible();

  await page.goto('/cart');
  await page.getByRole('link', { name: 'Go to checkout', exact: true }).click();

  // The form is only shown, never submitted: submitting places a real order.
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { name: 'Checkout', exact: true }), 'checkout page heading').toBeVisible();
  await expect(main.getByLabel('Name', { exact: true }), 'checkout name field').toBeVisible();
  await expect(main.getByLabel('Email', { exact: true }), 'checkout email field').toBeVisible();
  await expect(main.getByLabel('Address', { exact: true }), 'checkout address field').toBeVisible();
  await expect(main.getByRole('button', { name: 'Place order', exact: true }), 'place-order button').toBeVisible();
});
