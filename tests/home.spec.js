// ACCESSIBILITY-20261121-5053: TC1
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { guardedViolations } from './helpers/axe.js';

test('shows this week’s products', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Corner Shop' })).toBeVisible();
  await expect(page.getByText('Blue mug, $8.00')).toBeVisible();
});

test('home page has no axe violations of minor impact or worse', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Corner Shop', exact: true })).toBeVisible();
  await expect(page.getByText('Blue mug, $8.00', { exact: true })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(guardedViolations(results)).toEqual([]);
});
