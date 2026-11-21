// SHOP-14: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9
// Smoke suite of the shop's critical paths, run with `npm run test:smoke` locally or against a
// deployed build (BASE_URL). Only placing an order changes anything on the server, so that test is
// tagged @places-order and left out against a deployed build unless SMOKE_PLACE_ORDER=1.
import { test, expect } from '@playwright/test';
import { findProduct, formatPrice, PRODUCTS } from '../src/catalogue.js';

/** The catalogue entry for an id, failing when the catalogue no longer has it. */
function product(id) {
  const found = findProduct(id);
  if (!found) throw new Error(`No product ${id} in the catalogue`);
  return found;
}

const cartLink = (page, count) => page.getByRole('link', { name: `Cart (${count})`, exact: true });
const totalLine = (page) => page.getByRole('paragraph').filter({ hasText: /^Total:/ });

/** Adds a product from its page and waits until the header shows the new count. */
async function addToCart(page, id, countAfter) {
  await page.goto(`/products/${encodeURIComponent(id)}`);
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await expect(cartLink(page, countAfter)).toBeVisible();
}

test('health check reports the shop is up @smoke', async ({ request }) => {
  const response = await request.get('/health', { timeout: 10_000 });

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: 'ok' });
});

test('catalogue lists every product with its price @smoke', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Our teaware', exact: true })).toBeVisible();
  for (const item of PRODUCTS) {
    const link = page.getByRole('link', { name: item.name, exact: true });
    const entry = page.getByRole('listitem').filter({ has: link });
    await expect(entry.getByRole('link', { name: item.name, exact: true })).toHaveAttribute(
      'href',
      `/products/${item.id}`,
    );
    await expect(entry.getByText(formatPrice(item.priceCents), { exact: true })).toBeVisible();
  }
});

test('opens a product page from the catalogue @smoke', async ({ page }) => {
  const teapot = product('teapot');
  await page.goto('/');

  await page.getByRole('link', { name: teapot.name, exact: true }).click();

  await expect(page).toHaveURL(`/products/${teapot.id}`);
  await expect(page.getByRole('heading', { level: 1, name: teapot.name, exact: true })).toBeVisible();
  await expect(page.getByRole('main').getByText(formatPrice(teapot.priceCents), { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add to cart', exact: true })).toBeEnabled();
});

test('shows Not found for an unknown product @smoke', async ({ page }) => {
  const response = await page.goto('/products/no-such-teapot');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Not found', exact: true })).toBeVisible();
});

test('adding a product updates the cart count @smoke', async ({ page }) => {
  await page.goto('/products/mugs');
  await expect(cartLink(page, 0)).toBeVisible();

  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();

  await expect(page.getByRole('status')).toHaveText('Added to your cart');
  await expect(cartLink(page, 1)).toBeVisible();
});

test('cart lists the added items and their total @smoke', async ({ page }) => {
  const teapot = product('teapot');
  const mugs = product('mugs');
  await addToCart(page, teapot.id, 1);
  await addToCart(page, teapot.id, 2);
  await addToCart(page, mugs.id, 3);

  await cartLink(page, 3).click();

  await expect(page).toHaveURL('/cart');
  const row = (name) => page.getByRole('row').filter({ has: page.getByRole('cell', { name, exact: true }) });
  await expect(row(teapot.name).getByRole('cell', { name: '2', exact: true })).toBeVisible();
  await expect(
    row(teapot.name).getByRole('cell', { name: formatPrice(teapot.priceCents * 2), exact: true }),
  ).toBeVisible();
  await expect(row(mugs.name).getByRole('cell', { name: '1', exact: true })).toBeVisible();
  await expect(row(mugs.name).getByRole('cell', { name: formatPrice(mugs.priceCents), exact: true })).toBeVisible();
  await expect(totalLine(page)).toHaveText(`Total: ${formatPrice(teapot.priceCents * 2 + mugs.priceCents)}`);
  await expect(page.getByRole('link', { name: 'Go to checkout', exact: true })).toBeVisible();
});

test('checkout with an empty cart offers no order form @smoke', async ({ page }) => {
  await page.goto('/checkout');

  await expect(page.getByRole('heading', { level: 1, name: 'Checkout', exact: true })).toBeVisible();
  await expect(page.getByRole('main').getByText('Your cart is empty.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Place order', exact: true })).toHaveCount(0);
});

test("checkout refuses to place an order without the shopper's details @smoke", async ({ page }) => {
  const kettle = product('kettle');
  await addToCart(page, kettle.id, 1);
  await page.goto('/checkout');
  await expect(totalLine(page)).toHaveText(`Total: ${formatPrice(kettle.priceCents)}`);
  const orderRequests = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/orders') orderRequests.push(request);
  });

  await page.getByRole('button', { name: 'Place order', exact: true }).click();

  // A blocked submit moves focus to the first invalid field; a submit that goes through leaves it on the button.
  const name = page.getByRole('textbox', { name: 'Name', exact: true });
  await expect(name).toBeFocused();
  expect(await name.evaluate((input) => input.validity.valueMissing)).toBe(true);
  await expect(page).toHaveURL('/checkout');
  await expect(totalLine(page)).toHaveText(`Total: ${formatPrice(kettle.priceCents)}`);
  expect(orderRequests).toEqual([]);
});

// Tagged @places-order: playwright.config.js leaves it out against a deployed build unless SMOKE_PLACE_ORDER=1.
test('places an order and shows its confirmation @smoke', { tag: '@places-order' }, async ({ page }, testInfo) => {
  const mugs = product('mugs');
  const shopper = `Smoke ${testInfo.testId} r${testInfo.retry} ${Math.random().toString(36).slice(2, 8)}`;
  await addToCart(page, mugs.id, 1);
  await page.goto('/checkout');

  await page.getByRole('textbox', { name: 'Name', exact: true }).fill(shopper);
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('smoke@example.com');
  await page.getByRole('textbox', { name: 'Address', exact: true }).fill('1 Smoke Lane, London');
  await page.getByRole('button', { name: 'Place order', exact: true }).click();

  await expect(page).toHaveURL(/\/orders\/\d+$/);
  const orderId = /\/orders\/(\d+)$/.exec(new URL(page.url()).pathname)?.[1];
  if (!orderId) throw new Error(`No order id in ${page.url()}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Thank you', exact: true })).toBeVisible();
  await expect(
    page
      .getByRole('main')
      .getByText(`Order #${orderId} is placed: ${formatPrice(mugs.priceCents)}, on its way to ${shopper}.`, {
        exact: true,
      }),
  ).toBeVisible();
  await expect(cartLink(page, 0)).toBeVisible();
});
