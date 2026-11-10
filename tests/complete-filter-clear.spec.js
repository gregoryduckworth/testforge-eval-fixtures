// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8
import { expect, test } from '@playwright/test';

const todoList = (page) => page.getByRole('list', { name: 'Todos' });
const todoItems = (page) => todoList(page).getByRole('listitem');
const checkbox = (page, title) => todoList(page).getByRole('checkbox', { name: title, exact: true });
const todoText = (page, title) => todoList(page).getByText(title, { exact: true });
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

async function expectPressed(page, selected) {
  for (const name of ['All', 'Active', 'Completed']) {
    await expect(filterButton(page, name)).toHaveAttribute('aria-pressed', String(name === selected));
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('ticking a todo strikes it through and decreases the items left count', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await expect(itemsLeft(page, '2 items left')).toBeVisible();

  await checkbox(page, 'Buy milk').check();

  await expect(checkbox(page, 'Buy milk')).toBeChecked();
  await expect(todoText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(todoText(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page, '1 item left')).toBeVisible();
});

test('unticking a completed todo removes the strike-through and restores the count', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await checkbox(page, 'Buy milk').check();
  await expect(todoText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(itemsLeft(page, '1 item left')).toBeVisible();

  await checkbox(page, 'Buy milk').uncheck();

  await expect(checkbox(page, 'Buy milk')).not.toBeChecked();
  await expect(todoText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page, '2 items left')).toBeVisible();
});

test('Active filter shows only uncompleted todos and is shown as pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();

  await filterButton(page, 'Active').click();

  await expect(todoItems(page)).toHaveText(['Buy milk', 'Pay rent']);
  await expectPressed(page, 'Active');
});

test('Completed filter shows only completed todos and is shown as pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();

  await filterButton(page, 'Completed').click();

  await expect(todoItems(page)).toHaveText(['Walk dog']);
  await expectPressed(page, 'Completed');
});

test('All filter shows every todo again and is shown as pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();
  await filterButton(page, 'Completed').click();
  await expect(todoItems(page)).toHaveText(['Walk dog']);

  await filterButton(page, 'All').click();

  await expect(todoItems(page)).toHaveText(['Buy milk', 'Walk dog', 'Pay rent']);
  await expectPressed(page, 'All');
});

test('ticking a todo while the Active filter is selected hides it from the list', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await filterButton(page, 'Active').click();
  await expect(todoItems(page)).toHaveText(['Buy milk', 'Walk dog']);

  // click(), not check(): the ticked row leaves the filtered list, so check() can't re-read its state.
  await checkbox(page, 'Buy milk').click();

  await expect(todoItems(page)).toHaveText(['Walk dog']);
  await expect(checkbox(page, 'Buy milk')).toHaveCount(0);
  await expectPressed(page, 'Active');
  await expect(itemsLeft(page, '1 item left')).toBeVisible();
});

test('Clear completed is hidden until a todo is completed and hidden again when it is unticked', async ({
  page,
}) => {
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

  await clearCompleted(page).click();

  await expect(todoItems(page)).toHaveText(['Walk dog']);
  await expect(itemsLeft(page, '1 item left')).toBeVisible();
  await expect(clearCompleted(page)).toBeHidden();
});
