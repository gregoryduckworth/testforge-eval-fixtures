// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7
import { expect, test } from '@playwright/test';

function todoList(page) {
  return page.getByRole('list', { name: 'Todos' });
}

function todoItems(page) {
  return todoList(page).getByRole('listitem');
}

function checkbox(page, title) {
  return todoList(page).getByRole('checkbox', { name: title, exact: true });
}

function todoTitle(page, title) {
  return todoList(page).getByText(title, { exact: true });
}

// The count paragraph has no role or test id; its exact text is unique within the main region.
function itemsLeft(page, text) {
  return page.getByRole('main').getByText(text, { exact: true });
}

function filterButton(page, name) {
  return page.getByRole('navigation', { name: 'Filter' }).getByRole('button', { name, exact: true });
}

function clearCompletedButton(page) {
  return page.getByRole('button', { name: 'Clear completed', exact: true });
}

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

test('ticking a todo strikes it through and lowers the items left count', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await expect(itemsLeft(page, '2 items left')).toBeVisible();
  await expect(todoTitle(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');

  await checkbox(page, 'Buy milk').check();

  await expect(checkbox(page, 'Buy milk')).toBeChecked();
  await expect(todoTitle(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(todoTitle(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page, '1 item left')).toBeVisible();
});

test('unticking a completed todo removes the strike-through and restores the items left count', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await checkbox(page, 'Buy milk').check();
  await expect(itemsLeft(page, '1 item left')).toBeVisible();
  await expect(todoTitle(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');

  await checkbox(page, 'Buy milk').uncheck();

  await expect(checkbox(page, 'Buy milk')).not.toBeChecked();
  await expect(todoTitle(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page, '2 items left')).toBeVisible();
});

test('Active filter shows only todos that are not completed and is shown as pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();

  await filterButton(page, 'Active').click();

  await expect(todoItems(page)).toHaveText(['Buy milk', 'Pay rent']);
  await expectPressedFilter(page, 'Active');
});

test('Completed filter shows only completed todos and is shown as pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();

  await filterButton(page, 'Completed').click();

  await expect(todoItems(page)).toHaveText(['Walk dog']);
  await expectPressedFilter(page, 'Completed');
});

test('All filter shows every todo again after another filter and is shown as pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();
  await expectPressedFilter(page, 'All');
  await filterButton(page, 'Completed').click();
  await expect(todoItems(page)).toHaveText(['Walk dog']);

  await filterButton(page, 'All').click();

  await expect(todoItems(page)).toHaveText(['Buy milk', 'Walk dog', 'Pay rent']);
  await expectPressedFilter(page, 'All');
});

test('Clear completed is hidden until a todo is completed and hidden again when it is unticked', async ({ page }) => {
  await addTodos(page, ['Buy milk']);
  await expect(itemsLeft(page, '1 item left')).toBeVisible();
  await expect(clearCompletedButton(page)).toBeHidden();

  await checkbox(page, 'Buy milk').check();
  await expect(clearCompletedButton(page)).toBeVisible();

  await checkbox(page, 'Buy milk').uncheck();
  await expect(itemsLeft(page, '1 item left')).toBeVisible();
  await expect(clearCompletedButton(page)).toBeHidden();
});

test('Clear completed removes every completed todo and keeps the active ones', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Buy milk').check();
  await checkbox(page, 'Pay rent').check();
  await expect(itemsLeft(page, '1 item left')).toBeVisible();

  await clearCompletedButton(page).click();

  await expect(todoItems(page)).toHaveText(['Walk dog']);
  await expect(itemsLeft(page, '1 item left')).toBeVisible();
  await expect(clearCompletedButton(page)).toBeHidden();
});
