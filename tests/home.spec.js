// GAPS-20261122-631C: TC1
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { guardedViolations } from './support/axe.js';

test('shows this week’s products', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Corner Shop' })).toBeVisible();
  await expect(page.getByText('Blue mug, $8.00')).toBeVisible();
});

test('home page has no axe violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Blue mug, $8.00')).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(guardedViolations(results)).toEqual([]);
});
