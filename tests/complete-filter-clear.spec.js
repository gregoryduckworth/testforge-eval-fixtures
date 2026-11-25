// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7
import { expect, test } from '@playwright/test';

/** @param {import('@playwright/test').Page} page @param {string[]} titles */
async function addTodos(page, titles) {
  for (const title of titles) {
    await page.getByLabel('What needs doing?').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
  }
  await expect(todoItems(page)).toHaveText(titles);
}

/** @param {import('@playwright/test').Page} page */
function todoItems(page) {
  return page.getByRole('list', { name: 'Todos', exact: true }).getByRole('listitem');
}

/** @param {import('@playwright/test').Page} page @param {string} title */
function checkbox(page, title) {
  return page.getByRole('list', { name: 'Todos', exact: true }).getByRole('checkbox', { name: title, exact: true });
}

/** @param {import('@playwright/test').Page} page @param {string} title */
function todoTitle(page, title) {
  return todoItems(page).getByText(title, { exact: true });
}

/**
 * The "items left" count: the page's only paragraph (`<p id="count">`, which has no role or name of its own).
 * @param {import('@playwright/test').Page} page
 */
function itemsLeft(page) {
  return page.getByRole('main').getByRole('paragraph');
}

/** @param {import('@playwright/test').Page} page @param {string} name */
function filterButton(page, name) {
  return page.getByRole('navigation', { name: 'Filter', exact: true }).getByRole('button', { name, exact: true });
}

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
  await expect(itemsLeft(page)).toHaveText('2 items left');
  await expect(todoTitle(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');

  await checkbox(page, 'Buy milk').check();

  await expect(checkbox(page, 'Buy milk')).toBeChecked();
  await expect(todoTitle(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(todoTitle(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page)).toHaveText('1 item left');
});

test('unticking a completed todo removes the strike-through and raises the items left count', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await checkbox(page, 'Buy milk').check();
  await expect(itemsLeft(page)).toHaveText('1 item left');
  await expect(todoTitle(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');

  await checkbox(page, 'Buy milk').uncheck();

  await expect(checkbox(page, 'Buy milk')).not.toBeChecked();
  await expect(todoTitle(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page)).toHaveText('2 items left');
});

test('Active filter shows only todos that are not completed and is pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();
  await expect(checkbox(page, 'Walk dog')).toBeChecked();

  await filterButton(page, 'Active').click();

  await expect(todoItems(page)).toHaveText(['Buy milk', 'Pay rent']);
  await expectPressed(page, 'Active');
});

test('Completed filter shows only completed todos and is pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();
  await expect(checkbox(page, 'Walk dog')).toBeChecked();

  await filterButton(page, 'Completed').click();

  await expect(todoItems(page)).toHaveText(['Walk dog']);
  await expectPressed(page, 'Completed');
});

test('All filter shows every todo again and is pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();
  await filterButton(page, 'Completed').click();
  await expect(todoItems(page)).toHaveText(['Walk dog']);

  await filterButton(page, 'All').click();

  await expect(todoItems(page)).toHaveText(['Buy milk', 'Walk dog', 'Pay rent']);
  await expectPressed(page, 'All');
});

test('Clear completed is shown only while a todo is completed', async ({ page }) => {
  const clearCompleted = page.getByRole('button', { name: 'Clear completed', exact: true });
  await addTodos(page, ['Buy milk']);
  await expect(clearCompleted).toBeHidden();

  await checkbox(page, 'Buy milk').check();
  await expect(clearCompleted).toBeVisible();

  await checkbox(page, 'Buy milk').uncheck();
  await expect(checkbox(page, 'Buy milk')).not.toBeChecked();
  await expect(clearCompleted).toBeHidden();
});

test('Clear completed removes every completed todo and keeps active ones', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Buy milk').check();
  await checkbox(page, 'Pay rent').check();
  await expect(itemsLeft(page)).toHaveText('1 item left');

  await page.getByRole('button', { name: 'Clear completed', exact: true }).click();

  await expect(todoItems(page)).toHaveText(['Walk dog']);
  await expect(itemsLeft(page)).toHaveText('1 item left');
  await expect(page.getByRole('button', { name: 'Clear completed', exact: true })).toBeHidden();
});
