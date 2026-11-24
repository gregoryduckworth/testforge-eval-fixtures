// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8
import { expect, test } from '@playwright/test';

/** @param {import('@playwright/test').Page} page */
function todoList(page) {
  return page.getByRole('list', { name: 'Todos' });
}

/** @param {import('@playwright/test').Page} page @param {string} title */
function checkbox(page, title) {
  return todoList(page).getByRole('checkbox', { name: title, exact: true });
}

/** @param {import('@playwright/test').Page} page @param {string} title */
function todoTitle(page, title) {
  return todoList(page).getByText(title, { exact: true });
}

/** The "N items left" paragraph. @param {import('@playwright/test').Page} page */
function itemsLeft(page) {
  return page.getByText(/^\d+ items? left$/);
}

/** @param {import('@playwright/test').Page} page @param {string} name */
function filterButton(page, name) {
  return page.getByRole('navigation', { name: 'Filter' }).getByRole('button', { name, exact: true });
}

/** @param {import('@playwright/test').Page} page */
function clearCompleted(page) {
  return page.getByRole('button', { name: 'Clear completed', exact: true });
}

/** @param {import('@playwright/test').Page} page @param {string[]} titles */
async function addTodos(page, titles) {
  await page.goto('/');
  for (const title of titles) {
    await page.getByLabel('What needs doing?').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
  }
  await expect(todoList(page).getByRole('listitem')).toHaveText(titles);
}

/** @param {import('@playwright/test').Page} page @param {'All' | 'Active' | 'Completed'} selected */
async function expectPressedFilter(page, selected) {
  for (const name of ['All', 'Active', 'Completed']) {
    await expect(filterButton(page, name)).toHaveAttribute('aria-pressed', String(name === selected));
  }
}

test('ticking a todo strikes it through and lowers the items left count by one', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await expect(itemsLeft(page)).toHaveText('2 items left');

  await checkbox(page, 'Buy milk').check();

  await expect(checkbox(page, 'Buy milk')).toBeChecked();
  await expect(todoTitle(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(todoTitle(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page)).toHaveText('1 item left');
});

test('unticking a completed todo removes the strike-through and restores the count', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await checkbox(page, 'Buy milk').check();
  await expect(itemsLeft(page)).toHaveText('1 item left');

  await checkbox(page, 'Buy milk').uncheck();

  await expect(checkbox(page, 'Buy milk')).not.toBeChecked();
  await expect(todoTitle(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page)).toHaveText('2 items left');
});

test('the Active filter shows only todos that are not completed and is shown as pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();

  await filterButton(page, 'Active').click();

  await expect(todoList(page).getByRole('listitem')).toHaveText(['Buy milk', 'Pay rent']);
  await expectPressedFilter(page, 'Active');
});

test('the Completed filter shows only completed todos and is shown as pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();

  await filterButton(page, 'Completed').click();

  await expect(todoList(page).getByRole('listitem')).toHaveText(['Walk dog']);
  await expectPressedFilter(page, 'Completed');
});

test('the All filter shows every todo again and is shown as pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();
  await filterButton(page, 'Completed').click();
  await expect(todoList(page).getByRole('listitem')).toHaveText(['Walk dog']);

  await filterButton(page, 'All').click();

  await expect(todoList(page).getByRole('listitem')).toHaveText(['Buy milk', 'Walk dog', 'Pay rent']);
  await expectPressedFilter(page, 'All');
});

test('un-completing a todo while the Completed filter is selected removes it from the view', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await checkbox(page, 'Buy milk').check();
  await checkbox(page, 'Walk dog').check();
  await filterButton(page, 'Completed').click();
  await expect(todoList(page).getByRole('listitem')).toHaveText(['Buy milk', 'Walk dog']);

  // click(), not uncheck(): uncheck() re-reads the box after clicking, and the todo leaves this view.
  await checkbox(page, 'Buy milk').click();

  await expect(todoList(page).getByRole('listitem')).toHaveText(['Walk dog']);
  await expect(itemsLeft(page)).toHaveText('1 item left');
});

test('Clear completed is shown only while a todo is completed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await expect(itemsLeft(page)).toHaveText('2 items left');
  await expect(clearCompleted(page)).toBeHidden();

  await checkbox(page, 'Buy milk').check();
  await expect(clearCompleted(page)).toBeVisible();

  await checkbox(page, 'Buy milk').uncheck();
  await expect(itemsLeft(page)).toHaveText('2 items left');
  await expect(clearCompleted(page)).toBeHidden();
});

test('Clear completed removes every completed todo and keeps the active ones', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Buy milk').check();
  await checkbox(page, 'Pay rent').check();
  await expect(itemsLeft(page)).toHaveText('1 item left');

  await clearCompleted(page).click();

  await expect(todoList(page).getByRole('listitem')).toHaveText(['Walk dog']);
  await expect(itemsLeft(page)).toHaveText('1 item left');
  await expect(clearCompleted(page)).toBeHidden();
});
