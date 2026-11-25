// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7
import { expect, test } from '@playwright/test';

/** @param {import('@playwright/test').Page} page @param {string[]} titles */
async function addTodos(page, titles) {
  for (const title of titles) {
    await page.getByLabel('What needs doing?').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
  }
  await expect(todoList(page).getByRole('listitem')).toHaveText(titles);
}

/** @param {import('@playwright/test').Page} page */
const todoList = (page) => page.getByRole('list', { name: 'Todos' });

/** @param {import('@playwright/test').Page} page @param {string} title */
const checkbox = (page, title) => todoList(page).getByRole('checkbox', { name: title, exact: true });

/** @param {import('@playwright/test').Page} page @param {string} title */
const todoTitle = (page, title) => todoList(page).getByText(title, { exact: true });

/** @param {import('@playwright/test').Page} page @param {string} name */
const filterButton = (page, name) =>
  page.getByRole('navigation', { name: 'Filter' }).getByRole('button', { name, exact: true });

/** @param {import('@playwright/test').Page} page */
const clearCompleted = (page) => page.getByRole('button', { name: 'Clear completed', exact: true });

/** @param {import('@playwright/test').Page} page @param {'All' | 'Active' | 'Completed'} selected */
async function expectPressed(page, selected) {
  for (const name of ['All', 'Active', 'Completed']) {
    await expect(filterButton(page, name)).toHaveAttribute('aria-pressed', String(name === selected));
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('ticking a todo strikes it through and lowers the items left count', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await expect(page.getByText('2 items left', { exact: true })).toBeVisible();

  await checkbox(page, 'Buy milk').check();

  await expect(checkbox(page, 'Buy milk')).toBeChecked();
  await expect(todoTitle(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(todoTitle(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
});

test('unticking a completed todo removes the strike-through and restores the count', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await checkbox(page, 'Buy milk').check();
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();

  await checkbox(page, 'Buy milk').uncheck();

  await expect(checkbox(page, 'Buy milk')).not.toBeChecked();
  await expect(todoTitle(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('2 items left', { exact: true })).toBeVisible();
});

test("Active filter shows only todos that aren't completed and is shown as pressed", async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();

  await filterButton(page, 'Active').click();

  await expect(todoList(page).getByRole('listitem')).toHaveText(['Buy milk', 'Pay rent']);
  await expectPressed(page, 'Active');
});

test('Completed filter shows only completed todos and is shown as pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();

  await filterButton(page, 'Completed').click();

  await expect(todoList(page).getByRole('listitem')).toHaveText(['Walk dog']);
  await expectPressed(page, 'Completed');
});

test('All filter shows every todo again and is shown as pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();
  await filterButton(page, 'Completed').click();
  await expect(todoList(page).getByRole('listitem')).toHaveText(['Walk dog']);

  await filterButton(page, 'All').click();

  await expect(todoList(page).getByRole('listitem')).toHaveText(['Buy milk', 'Walk dog', 'Pay rent']);
  await expectPressed(page, 'All');
});

test('Clear completed is hidden while no todo is completed', async ({ page }) => {
  await addTodos(page, ['Buy milk']);
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
  await expect(clearCompleted(page)).toBeHidden();
  await checkbox(page, 'Buy milk').check();
  await expect(clearCompleted(page)).toBeVisible();

  await checkbox(page, 'Buy milk').uncheck();

  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
  await expect(clearCompleted(page)).toBeHidden();
});

test('Clear completed removes every completed todo and keeps active ones', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Buy milk').check();
  await checkbox(page, 'Pay rent').check();

  await clearCompleted(page).click();

  await expect(todoList(page).getByRole('listitem')).toHaveText(['Walk dog']);
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
  await expect(clearCompleted(page)).toBeHidden();
});
