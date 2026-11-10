// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7
import { expect, test } from '@playwright/test';

/** @param {import('@playwright/test').Page} page */
function todoList(page) {
  return page.getByRole('list', { name: 'Todos' });
}

/** @param {import('@playwright/test').Page} page */
function todoItems(page) {
  return todoList(page).getByRole('listitem');
}

/** @param {import('@playwright/test').Page} page @param {string[]} titles */
async function addTodos(page, titles) {
  for (const title of titles) {
    await page.getByLabel('What needs doing?').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
  }
  await expect(todoItems(page)).toHaveText(titles);
}

/** @param {import('@playwright/test').Page} page @param {string} title */
function checkbox(page, title) {
  return todoList(page).getByRole('checkbox', { name: title, exact: true });
}

/** @param {import('@playwright/test').Page} page @param {string} title */
function titleText(page, title) {
  return todoList(page).getByText(title, { exact: true });
}

/** @param {import('@playwright/test').Page} page @param {string} text */
function itemsLeft(page, text) {
  // The count is the footer paragraph; todo titles are spans, so they can't match.
  return page.getByRole('paragraph').and(page.getByText(text, { exact: true }));
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

/** @param {import('@playwright/test').Page} page */
function clearCompleted(page) {
  return page.getByRole('button', { name: 'Clear completed', exact: true });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('ticking a todo strikes it through and decrements items left', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await expect(itemsLeft(page, '2 items left')).toBeVisible();
  await expect(titleText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');

  await checkbox(page, 'Buy milk').check();

  await expect(checkbox(page, 'Buy milk')).toBeChecked();
  await expect(titleText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(titleText(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page, '1 item left')).toBeVisible();
});

test('unticking a completed todo restores it and increments items left', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await checkbox(page, 'Buy milk').check();
  await expect(itemsLeft(page, '1 item left')).toBeVisible();
  await expect(titleText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');

  await checkbox(page, 'Buy milk').uncheck();

  await expect(checkbox(page, 'Buy milk')).not.toBeChecked();
  await expect(titleText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page, '2 items left')).toBeVisible();
});

test('Active filter shows only todos that are not completed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();

  await filterButton(page, 'Active').click();

  await expect(todoItems(page)).toHaveText(['Buy milk', 'Pay rent']);
  await expectPressedFilter(page, 'Active');
});

test('Completed filter shows only completed todos', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();

  await filterButton(page, 'Completed').click();

  await expect(todoItems(page)).toHaveText(['Walk dog']);
  await expectPressedFilter(page, 'Completed');
});

test('All filter shows every todo again after another filter', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();
  await filterButton(page, 'Completed').click();
  await expect(todoItems(page)).toHaveText(['Walk dog']);

  await filterButton(page, 'All').click();

  await expect(todoItems(page)).toHaveText(['Buy milk', 'Walk dog', 'Pay rent']);
  await expectPressedFilter(page, 'All');
});

test('Clear completed is shown only while a todo is completed', async ({ page }) => {
  await addTodos(page, ['Buy milk']);
  await expect(clearCompleted(page)).toBeHidden();

  await checkbox(page, 'Buy milk').check();
  await expect(clearCompleted(page)).toBeVisible();

  await checkbox(page, 'Buy milk').uncheck();
  await expect(clearCompleted(page)).toBeHidden();
});

test('Clear completed removes every completed todo and keeps active ones', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Buy milk').check();
  await checkbox(page, 'Pay rent').check();
  await expect(itemsLeft(page, '1 item left')).toBeVisible();
  await expect(clearCompleted(page)).toBeVisible();

  await clearCompleted(page).click();

  await expect(todoItems(page)).toHaveText(['Walk dog']);
  await expect(itemsLeft(page, '1 item left')).toBeVisible();
  await expect(clearCompleted(page)).toBeHidden();
});
