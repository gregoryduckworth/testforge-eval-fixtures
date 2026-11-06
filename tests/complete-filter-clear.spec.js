// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7
import { expect, test } from '@playwright/test';

/** @param {import('@playwright/test').Page} page @param {string[]} titles */
async function addTodos(page, titles) {
  for (const title of titles) {
    await page.getByLabel('What needs doing?').fill(title);
    await page.getByRole('button', { name: 'Add' }).click();
  }
  await expect(todoItems(page)).toHaveText(titles);
}

/** @param {import('@playwright/test').Page} page */
function todoItems(page) {
  return page.getByRole('list', { name: 'Todos' }).getByRole('listitem');
}

/** @param {import('@playwright/test').Page} page @param {string} title */
function checkbox(page, title) {
  return page.getByRole('checkbox', { name: title, exact: true });
}

/** @param {import('@playwright/test').Page} page @param {string} title */
function todoText(page, title) {
  return page.getByRole('list', { name: 'Todos' }).getByText(title, { exact: true });
}

/** @param {import('@playwright/test').Page} page @param {string} name */
function filterButton(page, name) {
  return page.getByRole('navigation', { name: 'Filter' }).getByRole('button', { name, exact: true });
}

/** @param {import('@playwright/test').Page} page @param {'All' | 'Active' | 'Completed'} selected */
async function expectPressedFilter(page, selected) {
  for (const name of ['All', 'Active', 'Completed']) {
    await expect(filterButton(page, name)).toHaveAttribute('aria-pressed', String(name === selected));
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('ticking a todo strikes it through and decrements the items left', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await expect(page.getByText('2 items left', { exact: true })).toBeVisible();
  await expect(todoText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');

  await checkbox(page, 'Buy milk').check();

  await expect(checkbox(page, 'Buy milk')).toBeChecked();
  await expect(todoText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(todoText(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
});

test('unticking a completed todo removes the strike-through and restores the items left', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await checkbox(page, 'Buy milk').check();
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
  await expect(todoText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');

  await checkbox(page, 'Buy milk').uncheck();

  await expect(checkbox(page, 'Buy milk')).not.toBeChecked();
  await expect(todoText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('2 items left', { exact: true })).toBeVisible();
});

test('Active filter shows only uncompleted todos and is pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();

  await filterButton(page, 'Active').click();

  await expect(todoItems(page)).toHaveText(['Buy milk', 'Pay rent']);
  await expectPressedFilter(page, 'Active');
});

test('Completed filter shows only completed todos and is pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();

  await filterButton(page, 'Completed').click();

  await expect(todoItems(page)).toHaveText(['Walk dog']);
  await expectPressedFilter(page, 'Completed');
});

test('All filter shows every todo again and is pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();
  await filterButton(page, 'Completed').click();
  await expect(todoItems(page)).toHaveText(['Walk dog']);

  await filterButton(page, 'All').click();

  await expect(todoItems(page)).toHaveText(['Buy milk', 'Walk dog', 'Pay rent']);
  await expectPressedFilter(page, 'All');
});

test('Clear completed is hidden while no todo is completed', async ({ page }) => {
  const clearCompleted = page.getByRole('button', { name: 'Clear completed', exact: true });
  await addTodos(page, ['Buy milk']);
  await expect(clearCompleted).toBeHidden();

  await checkbox(page, 'Buy milk').check();
  await expect(clearCompleted).toBeVisible();

  await checkbox(page, 'Buy milk').uncheck();
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
  await expect(clearCompleted).toBeHidden();
});

test('Clear completed removes every completed todo and keeps active ones', async ({ page }) => {
  const clearCompleted = page.getByRole('button', { name: 'Clear completed', exact: true });
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Buy milk').check();
  await checkbox(page, 'Pay rent').check();
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();

  await clearCompleted.click();

  await expect(todoItems(page)).toHaveText(['Walk dog']);
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
  await expect(clearCompleted).toBeHidden();
});
