// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7
import { expect, test } from '@playwright/test';

async function addTodos(page, titles) {
  await page.goto('/');
  for (const title of titles) {
    await page.getByLabel('What needs doing?').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(todoList(page).getByText(title, { exact: true })).toBeVisible();
  }
}

const todoList = (page) => page.getByRole('list', { name: 'Todos' });
const checkbox = (page, title) => page.getByRole('checkbox', { name: title, exact: true });
const titleText = (page, title) => todoList(page).getByText(title, { exact: true });
const filter = (page, name) =>
  page.getByRole('navigation', { name: 'Filter' }).getByRole('button', { name, exact: true });
const clearButton = (page) => page.getByRole('button', { name: 'Clear completed', exact: true });

async function expectPressed(page, pressed) {
  for (const name of ['All', 'Active', 'Completed']) {
    await expect(filter(page, name)).toHaveAttribute('aria-pressed', name === pressed ? 'true' : 'false');
  }
}

test('ticking a todo strikes it through and decrements items left', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await expect(page.getByText('2 items left', { exact: true })).toBeVisible();

  await checkbox(page, 'Buy milk').check();

  await expect(checkbox(page, 'Buy milk')).toBeChecked();
  await expect(titleText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(titleText(page, 'Walk dog')).not.toHaveCSS('text-decoration-line', 'line-through');
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
});

test('unticking a completed todo removes the strike-through and restores items left', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await checkbox(page, 'Buy milk').check();
  await expect(titleText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();

  await checkbox(page, 'Buy milk').uncheck();

  await expect(checkbox(page, 'Buy milk')).not.toBeChecked();
  await expect(titleText(page, 'Buy milk')).not.toHaveCSS('text-decoration-line', 'line-through');
  await expect(page.getByText('2 items left', { exact: true })).toBeVisible();
});

test('Active filter shows only todos that are not completed and is pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();

  await filter(page, 'Active').click();

  await expect(todoList(page).getByRole('listitem')).toHaveText(['Buy milk', 'Pay rent']);
  await expectPressed(page, 'Active');
});

test('Completed filter shows only completed todos and is pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();

  await filter(page, 'Completed').click();

  await expect(todoList(page).getByRole('listitem')).toHaveText(['Walk dog']);
  await expectPressed(page, 'Completed');
});

test('All filter shows every todo again and is pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();

  await filter(page, 'Completed').click();
  await expect(todoList(page).getByRole('listitem')).toHaveText(['Walk dog']);
  await filter(page, 'All').click();

  await expect(todoList(page).getByRole('listitem')).toHaveText(['Buy milk', 'Walk dog', 'Pay rent']);
  await expectPressed(page, 'All');
});

test('Clear completed is shown only while a todo is completed', async ({ page }) => {
  await addTodos(page, ['Buy milk']);
  await expect(clearButton(page)).toBeHidden();

  await checkbox(page, 'Buy milk').check();
  await expect(clearButton(page)).toBeVisible();

  await checkbox(page, 'Buy milk').uncheck();
  await expect(clearButton(page)).toBeHidden();
});

test('Clear completed removes every completed todo and keeps active ones', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Buy milk').check();
  await checkbox(page, 'Pay rent').check();

  await clearButton(page).click();

  await expect(todoList(page).getByRole('listitem')).toHaveText(['Walk dog']);
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
  await expect(clearButton(page)).toBeHidden();
});
