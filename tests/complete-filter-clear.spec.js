// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7
import { expect, test } from '@playwright/test';

const todosList = (page) => page.getByRole('list', { name: 'Todos', exact: true });
const todoText = (page, title) => todosList(page).getByText(title, { exact: true });
const todoBox = (page, title) => page.getByRole('checkbox', { name: title, exact: true });
const filterButton = (page, name) =>
  page.getByRole('navigation', { name: 'Filter', exact: true }).getByRole('button', { name, exact: true });
const clearButton = (page) => page.getByRole('button', { name: 'Clear completed', exact: true });

async function addTodo(page, title) {
  await page.getByLabel('What needs doing?', { exact: true }).fill(title);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(todoText(page, title)).toBeVisible();
}

async function addTodos(page, titles) {
  await page.goto('/');
  for (const title of titles) {
    await addTodo(page, title);
  }
}

async function expectPressed(page, pressed) {
  for (const name of ['All', 'Active', 'Completed']) {
    await expect(filterButton(page, name)).toHaveAttribute('aria-pressed', String(name === pressed));
  }
}

const three = ['Buy milk', 'Walk dog', 'Pay rent'];

test('ticking a todo strikes it through and decrements items left', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await expect(page.getByText('2 items left', { exact: true })).toBeVisible();
  await expect(todoText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');

  await todoBox(page, 'Buy milk').check();

  await expect(todoBox(page, 'Buy milk')).toBeChecked();
  await expect(todoText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(todoText(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
});

test('unticking a completed todo removes the strike-through and restores items left', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await todoBox(page, 'Buy milk').check();
  await expect(todoText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();

  await todoBox(page, 'Buy milk').uncheck();

  await expect(todoBox(page, 'Buy milk')).not.toBeChecked();
  await expect(todoText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('2 items left', { exact: true })).toBeVisible();
});

test('Active filter shows only todos that are not completed and is pressed', async ({ page }) => {
  await addTodos(page, three);
  await todoBox(page, 'Walk dog').check();

  await filterButton(page, 'Active').click();

  await expect(todosList(page).getByRole('listitem')).toHaveText(['Buy milk', 'Pay rent']);
  await expectPressed(page, 'Active');
});

test('Completed filter shows only completed todos and is pressed', async ({ page }) => {
  await addTodos(page, three);
  await todoBox(page, 'Walk dog').check();

  await filterButton(page, 'Completed').click();

  await expect(todosList(page).getByRole('listitem')).toHaveText(['Walk dog']);
  await expectPressed(page, 'Completed');
});

test('All filter shows every todo again and is pressed', async ({ page }) => {
  await addTodos(page, three);
  await todoBox(page, 'Walk dog').check();
  await filterButton(page, 'Completed').click();
  await expect(todosList(page).getByRole('listitem')).toHaveText(['Walk dog']);

  await filterButton(page, 'All').click();

  await expect(todosList(page).getByRole('listitem')).toHaveText(three);
  await expectPressed(page, 'All');
});

test('Clear completed is hidden while no todo is completed', async ({ page }) => {
  await addTodos(page, ['Buy milk']);
  await expect(clearButton(page)).toBeHidden();

  await todoBox(page, 'Buy milk').check();
  await expect(clearButton(page)).toBeVisible();

  await todoBox(page, 'Buy milk').uncheck();
  await expect(clearButton(page)).toBeHidden();
});

test('Clear completed removes every completed todo and keeps active ones', async ({ page }) => {
  await addTodos(page, three);
  await todoBox(page, 'Buy milk').check();
  await todoBox(page, 'Pay rent').check();

  await clearButton(page).click();

  await expect(todosList(page).getByRole('listitem')).toHaveText(['Walk dog']);
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
  await expect(clearButton(page)).toBeHidden();
});
