// SHOP-21: TC1, TC2, TC3, TC4, TC5, TC7, TC8, TC9
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** WCAG 2.0 and 2.1, levels A and AA. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const BLOCKING_IMPACTS = ['critical', 'serious'];
/** The pages this file scans; the sitemap test checks the shop serves exactly these. */
const SCANNED_PATHS = ['/', '/cart', '/about', '/contact'];

/**
 * Scans the page and returns its critical and serious violations as rule id, impact,
 * WCAG tags and offending elements. Moderate and minor ones are attached to the report.
 */
async function blockingViolations(page, testInfo) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = (violation) => ({
    id: violation.id,
    impact: violation.impact,
    wcag: violation.tags.filter((tag) => tag.startsWith('wcag')),
    targets: violation.nodes.map((node) => node.target.join(' ')),
  });
  const other = results.violations.filter((violation) => !BLOCKING_IMPACTS.includes(violation.impact));
  if (other.length > 0) {
    await testInfo.attach('non-blocking accessibility violations', {
      body: JSON.stringify(other.map(summary), null, 2),
      contentType: 'application/json',
    });
  }
  return results.violations.filter((violation) => BLOCKING_IMPACTS.includes(violation.impact)).map(summary);
}

test('home page has no critical or serious accessibility violations', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Corner Shop', exact: true })).toBeVisible();

  const violations = await blockingViolations(page, testInfo);

  expect(violations).toEqual([]);
});

test('contact page has no critical or serious accessibility violations', async ({ page }, testInfo) => {
  await page.goto('/contact');
  await expect(page.getByRole('heading', { name: 'Contact us', exact: true })).toBeVisible();

  const violations = await blockingViolations(page, testInfo);

  expect(violations).toEqual([]);
});

test('contact page has no critical or serious accessibility violations after sending a message', async ({
  page,
}, testInfo) => {
  await page.goto('/contact');
  await page.getByLabel('Email', { exact: true }).fill('sam@example.com');
  await page.getByLabel('Message', { exact: true }).fill('Do you sell green tea?');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Thanks, we will reply within a day.');

  const violations = await blockingViolations(page, testInfo);

  expect(violations).toEqual([]);
});

test('cart page has no critical or serious accessibility violations', async ({ page }, testInfo) => {
  // Known defect: the product images in public/cart.html have no alt text (axe rule image-alt).
  // Remove test.fail() once they do.
  test.fail();
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Your cart', exact: true })).toBeVisible();

  const violations = await blockingViolations(page, testInfo);

  expect(violations).toEqual([]);
});

test('about page has no critical or serious accessibility violations', async ({ page }, testInfo) => {
  // Known defect: the small print in public/about.html is #c7c7c7 on white, below the 4.5:1
  // contrast WCAG AA asks for (axe rule color-contrast). Remove test.fail() once it meets it.
  test.fail();
  await page.goto('/about');
  await expect(page.getByRole('heading', { name: 'About us', exact: true })).toBeVisible();

  const violations = await blockingViolations(page, testInfo);

  expect(violations).toEqual([]);
});

// The two tests below pin the known violations behind the expected failures above, so a page
// that stops loading or gains another violation fails the suite. Update them when a fix lands.
test('cart page reports only the known image-alt violation on its two product images', async ({
  page,
}, testInfo) => {
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Your cart', exact: true })).toBeVisible();

  const violations = await blockingViolations(page, testInfo);

  expect(violations.map(({ id, impact, targets }) => ({ id, impact, targets }))).toEqual([
    { id: 'image-alt', impact: 'critical', targets: ['li:nth-child(1) > img', 'li:nth-child(2) > img'] },
  ]);
});

test('about page reports only the known color-contrast violation on its small print', async ({
  page,
}, testInfo) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { name: 'About us', exact: true })).toBeVisible();

  const violations = await blockingViolations(page, testInfo);

  expect(violations.map(({ id, impact, targets }) => ({ id, impact, targets }))).toEqual([
    { id: 'color-contrast', impact: 'serious', targets: ['.small-print'] },
  ]);
});

test('scans every page the sitemap lists', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  const xml = await response.text();

  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);

  expect(paths.toSorted()).toEqual(SCANNED_PATHS.toSorted());
});
