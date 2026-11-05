// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8
import { expect, test } from '@playwright/test';

async function addTodos(page, titles) {
  await page.goto('/');
  for (const title of titles) {
    await page.getByLabel('What needs doing?').fill(title);
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByRole('list', { name: 'Todos' }).getByText(title, { exact: true })).toBeVisible();
  }
}

// The title element of each listed todo, in list order (asserted per title, not on whole rows).
const items = (page) => page.getByRole('list', { name: 'Todos' }).getByRole('listitem').locator('span');
const checkbox = (page, title) => page.getByRole('checkbox', { name: title, exact: true });
const title = (page, name) => page.getByRole('list', { name: 'Todos' }).getByText(name, { exact: true });
const filter = (page, name) => page.getByRole('navigation', { name: 'Filter' }).getByRole('button', { name, exact: true });
const clearButton = (page) => page.getByRole('button', { name: 'Clear completed', exact: true });

test('ticking a todo strikes it through and decrements the items left count', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await expect(page.getByText('2 items left', { exact: true })).toBeVisible();

  await checkbox(page, 'Buy milk').check();

  await expect(checkbox(page, 'Buy milk')).toBeChecked();
  await expect(title(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(title(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
});

test('unticking a completed todo removes the strike-through and restores the count', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await checkbox(page, 'Buy milk').check();
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();

  await checkbox(page, 'Buy milk').uncheck();

  await expect(checkbox(page, 'Buy milk')).not.toBeChecked();
  await expect(title(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('2 items left', { exact: true })).toBeVisible();
});

test('Active filter shows only todos that are not completed and is pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();

  await filter(page, 'Active').click();

  await expect(items(page)).toHaveText(['Buy milk', 'Pay rent']);
  await expect(filter(page, 'Active')).toHaveAttribute('aria-pressed', 'true');
  await expect(filter(page, 'All')).toHaveAttribute('aria-pressed', 'false');
  await expect(filter(page, 'Completed')).toHaveAttribute('aria-pressed', 'false');
});

test('Completed filter shows only completed todos and is pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();

  await filter(page, 'Completed').click();

  await expect(items(page)).toHaveText(['Walk dog']);
  await expect(filter(page, 'Completed')).toHaveAttribute('aria-pressed', 'true');
  await expect(filter(page, 'All')).toHaveAttribute('aria-pressed', 'false');
  await expect(filter(page, 'Active')).toHaveAttribute('aria-pressed', 'false');
});

test('All filter shows every todo again after another filter was selected', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();
  await filter(page, 'Completed').click();
  await expect(items(page)).toHaveText(['Walk dog']);

  await filter(page, 'All').click();

  await expect(items(page)).toHaveText(['Buy milk', 'Walk dog', 'Pay rent']);
  await expect(filter(page, 'All')).toHaveAttribute('aria-pressed', 'true');
  await expect(filter(page, 'Active')).toHaveAttribute('aria-pressed', 'false');
  await expect(filter(page, 'Completed')).toHaveAttribute('aria-pressed', 'false');
});

test('completing a todo while Active is selected hides it from the list', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await filter(page, 'Active').click();
  await expect(items(page)).toHaveText(['Buy milk', 'Walk dog']);

  // click() rather than check(): the row leaves the Active list, so check() can't re-read its state.
  await checkbox(page, 'Buy milk').click();

  await expect(title(page, 'Buy milk')).toBeHidden();
  await expect(items(page)).toHaveText(['Walk dog']);
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
});

test('Clear completed appears only while a todo is completed', async ({ page }) => {
  await addTodos(page, ['Buy milk']);
  await expect(clearButton(page)).toBeHidden();

  await checkbox(page, 'Buy milk').check();
  await expect(clearButton(page)).toBeVisible();

  await checkbox(page, 'Buy milk').uncheck();
  await expect(clearButton(page)).toBeHidden();
});

test('Clear completed removes every completed todo and keeps active ones', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Buy milk').check();
  await checkbox(page, 'Pay rent').check();

  await clearButton(page).click();

  await expect(items(page)).toHaveText(['Walk dog']);
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
  await expect(clearButton(page)).toBeHidden();
});
