// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7
import { expect, test } from '@playwright/test';

const todoItems = (page) => page.getByRole('list', { name: 'Todos' }).getByRole('listitem');
const checkbox = (page, title) =>
  page.getByRole('list', { name: 'Todos' }).getByRole('checkbox', { name: title, exact: true });
const todoText = (page, title) => todoItems(page).getByText(title, { exact: true });
const itemsLeft = (page, text) => page.getByText(text, { exact: true });
const filterButton = (page, name) =>
  page.getByRole('navigation', { name: 'Filter' }).getByRole('button', { name, exact: true });
const clearCompleted = (page) => page.getByRole('button', { name: 'Clear completed', exact: true });

async function addTodos(page, titles) {
  for (const title of titles) {
    await page.getByLabel('What needs doing?').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
  }
  await expect(todoItems(page)).toHaveText(titles);
}

async function expectPressedFilter(page, pressed) {
  for (const name of ['All', 'Active', 'Completed']) {
    await expect(filterButton(page, name)).toHaveAttribute('aria-pressed', String(name === pressed));
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('ticking a todo strikes it through and decrements items left', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await expect(itemsLeft(page, '2 items left')).toBeVisible();
  await expect(todoText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');

  await checkbox(page, 'Buy milk').check();

  await expect(checkbox(page, 'Buy milk')).toBeChecked();
  await expect(todoText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(todoText(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page, '1 item left')).toBeVisible();
});

test('unticking a completed todo removes the strike-through and restores items left', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await checkbox(page, 'Buy milk').check();
  await expect(itemsLeft(page, '1 item left')).toBeVisible();
  await expect(todoText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');

  await checkbox(page, 'Buy milk').uncheck();

  await expect(checkbox(page, 'Buy milk')).not.toBeChecked();
  await expect(todoText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page, '2 items left')).toBeVisible();
});

test('Active filter shows only todos that are not completed and is pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();
  await expect(checkbox(page, 'Walk dog')).toBeChecked();

  await filterButton(page, 'Active').click();

  await expect(todoItems(page)).toHaveText(['Buy milk', 'Pay rent']);
  await expectPressedFilter(page, 'Active');
});

test('Completed filter shows only completed todos and is pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();
  await expect(checkbox(page, 'Walk dog')).toBeChecked();

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

test('Clear completed is shown only while a todo is completed', async ({ page }) => {
  await addTodos(page, ['Buy milk']);
  await expect(clearCompleted(page)).toBeHidden();

  await checkbox(page, 'Buy milk').check();
  await expect(clearCompleted(page)).toBeVisible();

  await checkbox(page, 'Buy milk').uncheck();
  await expect(checkbox(page, 'Buy milk')).not.toBeChecked();
  await expect(clearCompleted(page)).toBeHidden();
});

test('Clear completed removes every completed todo and keeps the active ones', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Buy milk').check();
  await checkbox(page, 'Pay rent').check();
  await expect(itemsLeft(page, '1 item left')).toBeVisible();

  await clearCompleted(page).click();

  await expect(todoItems(page)).toHaveText(['Walk dog']);
  await expect(itemsLeft(page, '1 item left')).toBeVisible();
  await expect(clearCompleted(page)).toBeHidden();
});
