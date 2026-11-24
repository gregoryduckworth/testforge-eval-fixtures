// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7
import { expect, test } from '@playwright/test';

/** @param {import('@playwright/test').Page} page */
const todoList = (page) => page.getByRole('list', { name: 'Todos' });

/** @param {import('@playwright/test').Page} page */
const itemsLeft = (page) => page.getByText(/^\d+ items? left$/);

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} title
 */
const todoTitle = (page, title) => todoList(page).getByText(title, { exact: true });

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} title
 */
const todoCheckbox = (page, title) => todoList(page).getByRole('checkbox', { name: title, exact: true });

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} name
 */
const filterButton = (page, name) =>
  page.getByRole('navigation', { name: 'Filter' }).getByRole('button', { name, exact: true });

/** @param {import('@playwright/test').Page} page */
const clearCompleted = (page) => page.getByRole('button', { name: 'Clear completed', exact: true });

/**
 * @param {import('@playwright/test').Page} page
 * @param {string[]} titles
 */
async function addTodos(page, titles) {
  for (const title of titles) {
    await page.getByLabel('What needs doing?').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(todoTitle(page, title)).toBeVisible();
  }
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {'All' | 'Active' | 'Completed'} selected
 */
async function expectPressedFilter(page, selected) {
  for (const name of ['All', 'Active', 'Completed']) {
    await expect(filterButton(page, name)).toHaveAttribute('aria-pressed', String(name === selected));
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('ticking a todo strikes it through and decrements items left', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await expect(itemsLeft(page)).toHaveText('2 items left');

  await todoCheckbox(page, 'Buy milk').check();

  await expect(todoCheckbox(page, 'Buy milk')).toBeChecked();
  await expect(todoTitle(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(todoTitle(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page)).toHaveText('1 item left');
});

test('unticking a completed todo removes the strike-through and restores items left', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await todoCheckbox(page, 'Buy milk').check();
  await expect(todoTitle(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(itemsLeft(page)).toHaveText('1 item left');

  await todoCheckbox(page, 'Buy milk').uncheck();

  await expect(todoCheckbox(page, 'Buy milk')).not.toBeChecked();
  await expect(todoTitle(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page)).toHaveText('2 items left');
});

test('Active filter shows only todos that are not completed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await todoCheckbox(page, 'Buy milk').check();
  await expectPressedFilter(page, 'All');

  await filterButton(page, 'Active').click();

  await expect(todoList(page).getByRole('listitem')).toHaveText(['Walk dog']);
  await expectPressedFilter(page, 'Active');
});

test('Completed filter shows only completed todos', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await todoCheckbox(page, 'Buy milk').check();

  await filterButton(page, 'Completed').click();

  await expect(todoList(page).getByRole('listitem')).toHaveText(['Buy milk']);
  await expectPressedFilter(page, 'Completed');
});

test('All filter shows every todo again after another filter', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await todoCheckbox(page, 'Buy milk').check();
  await filterButton(page, 'Active').click();
  await expect(todoList(page).getByRole('listitem')).toHaveText(['Walk dog']);

  await filterButton(page, 'All').click();

  await expect(todoList(page).getByRole('listitem')).toHaveText(['Buy milk', 'Walk dog']);
  await expectPressedFilter(page, 'All');
});

test('Clear completed is shown only while a todo is completed', async ({ page }) => {
  await addTodos(page, ['Buy milk']);
  await expect(itemsLeft(page)).toHaveText('1 item left');
  await expect(clearCompleted(page)).toBeHidden();

  await todoCheckbox(page, 'Buy milk').check();
  await expect(clearCompleted(page)).toBeVisible();

  await todoCheckbox(page, 'Buy milk').uncheck();
  await expect(itemsLeft(page)).toHaveText('1 item left');
  await expect(clearCompleted(page)).toBeHidden();
});

test('Clear completed removes every completed todo and keeps active ones', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await todoCheckbox(page, 'Buy milk').check();
  await todoCheckbox(page, 'Pay rent').check();
  await expect(itemsLeft(page)).toHaveText('1 item left');

  await clearCompleted(page).click();

  await expect(todoList(page).getByRole('listitem')).toHaveText(['Walk dog']);
  await expect(itemsLeft(page)).toHaveText('1 item left');
  await expect(clearCompleted(page)).toBeHidden();
});
