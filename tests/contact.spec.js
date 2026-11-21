// ACCESSIBILITY-20261121-5053: TC2
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { guardedViolations } from './helpers/axe.js';

test('sends a message', async ({ page }) => {
  await page.goto('/contact');
  await page.getByLabel('Email').fill('sam@example.com');
  await page.getByLabel('Message').fill('Do you sell green tea?');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByRole('status')).toHaveText('Thanks, we will reply within a day.');
});

test('contact page has no axe violations of minor impact or worse', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(guardedViolations(results)).toEqual([]);
});
