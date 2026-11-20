// SMOKE-20261120-5F35: TC1, TC2, TC3, TC4, TC5
// Read-only smoke tests: they send only GET requests and never submit the order form, so they can
// run against any deployed build. The cart lives in a browser cookie, so filling it writes nothing
// on the server.
import { test, expect } from '@playwright/test';
import { formatPrice, PRODUCTS } from '../../src/catalogue.js';

const product = PRODUCTS[0];
const productPath = `/products/${encodeURIComponent(product.id)}`;

test('health endpoint reports the shop is up @smoke', async ({ request }) => {
  const response = await request.get('/health', { timeout: 10_000 });

  expect(response.status(), 'GET /health should answer 200: the shop is not up').toBe(200);
  expect(await response.json(), 'GET /health should report status ok').toEqual({ status: 'ok' });
});

test('catalogue lists every product with its price @smoke', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Our teaware', exact: true }),
    'home page should show the catalogue',
  ).toBeVisible();
  for (const p of PRODUCTS) {
    const link = page.getByRole('link', { name: p.name, exact: true });
    await expect(link, `catalogue should link to ${p.name}`).toHaveAttribute(
      'href',
      `/products/${encodeURIComponent(p.id)}`,
    );
    const item = page.getByRole('listitem').filter({ has: link });
    await expect(
      item.getByText(formatPrice(p.priceCents), { exact: true }),
      `catalogue should show the price of ${p.name}`,
    ).toBeVisible();
  }
});

test('product page opens from the catalogue @smoke', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: product.name, exact: true }).click();

  await expect(page, 'catalogue link should open the product page').toHaveURL(productPath);
  const main = page.getByRole('main');
  await expect(
    main.getByRole('heading', { level: 1, name: product.name, exact: true }),
    'product page should show the product name',
  ).toBeVisible();
  await expect(
    main.getByText(formatPrice(product.priceCents), { exact: true }),
    'product page should show the price',
  ).toBeVisible();
  await expect(
    main.getByRole('button', { name: 'Add to cart', exact: true }),
    'product page should offer Add to cart',
  ).toBeVisible();
});

test('adding a product shows it in the cart @smoke', async ({ page }) => {
  await page.goto(productPath);

  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await expect(page.getByRole('status'), 'Add to cart should confirm the product was added').toHaveText(
    'Added to your cart',
  );
  const cartLink = page.getByRole('link', { name: 'Cart (1)', exact: true });
  await expect(cartLink, 'cart link should count the added product').toBeVisible();
  await cartLink.click();

  await expect(
    page.getByRole('heading', { level: 1, name: 'Your cart', exact: true }),
    'cart link should open the cart page',
  ).toBeVisible();
  const row = page.getByRole('row').filter({ has: page.getByRole('cell', { name: product.name, exact: true }) });
  await expect(row.getByRole('cell', { name: '1', exact: true }), 'cart should hold one of the product').toBeVisible();
  await expect(page.locator('#total'), 'cart total should be the product price').toHaveText(
    formatPrice(product.priceCents),
  );
});

test('checkout shows the order form for the cart @smoke', async ({ page, context, baseURL }) => {
  if (!baseURL) throw new Error('baseURL is not configured');
  await context.addCookies([{ name: 'cart', value: encodeURIComponent(`${product.id}:1`), url: baseURL }]);
  await page.goto('/cart');

  await page.getByRole('link', { name: 'Go to checkout', exact: true }).click();

  await expect(
    page.getByRole('heading', { level: 1, name: 'Checkout', exact: true }),
    'cart should lead to the checkout page',
  ).toBeVisible();
  await expect(
    page.getByRole('cell', { name: product.name, exact: true }),
    'checkout should list the cart contents',
  ).toBeVisible();
  await expect(page.getByLabel('Name', { exact: true }), 'checkout order form should ask for a name').toBeVisible();
  await expect(page.getByLabel('Email', { exact: true }), 'checkout order form should ask for an email').toBeVisible();
  await expect(
    page.getByLabel('Address', { exact: true }),
    'checkout order form should ask for an address',
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Place order', exact: true }),
    'checkout order form should offer Place order',
  ).toBeVisible();
});
