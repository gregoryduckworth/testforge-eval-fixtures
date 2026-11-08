// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7
import { expect, test } from '@playwright/test';

const todoList = (page) => page.getByRole('list', { name: 'Todos', exact: true });
const itemsLeft = (page, text) => page.getByText(text, { exact: true });

async function addTodos(page, titles) {
  await page.goto('/');
  for (const title of titles) {
    await page.getByLabel('What needs doing?', { exact: true }).fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
  }
  await expect(todoList(page).getByRole('listitem')).toHaveText(titles);
}

const checkbox = (page, title) => page.getByRole('checkbox', { name: title, exact: true });
const titleText = (page, title) => todoList(page).getByText(title, { exact: true });
const filter = (page, name) =>
  page.getByRole('navigation', { name: 'Filter' }).getByRole('button', { name, exact: true });
const clearCompleted = (page) =>
  page.getByRole('button', { name: 'Clear completed', exact: true });
const items = (page) => todoList(page).getByRole('listitem');

async function expectPressed(page, active) {
  for (const name of ['All', 'Active', 'Completed']) {
    await expect(filter(page, name)).toHaveAttribute('aria-pressed', String(name === active));
  }
}

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

test('unticking a completed todo removes the strike-through and restores items left', async ({
  page,
}) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await checkbox(page, 'Buy milk').check();
  await expect(itemsLeft(page, '1 item left')).toBeVisible();
  await expect(titleText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');

  await checkbox(page, 'Buy milk').uncheck();

  await expect(checkbox(page, 'Buy milk')).not.toBeChecked();
  await expect(titleText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page, '2 items left')).toBeVisible();
});

async function setupThree(page) {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();
  await expect(itemsLeft(page, '2 items left')).toBeVisible();
}

test('Active filter shows only todos that are not completed and is pressed', async ({ page }) => {
  await setupThree(page);
  await filter(page, 'Active').click();
  await expect(items(page)).toHaveText(['Buy milk', 'Pay rent']);
  await expectPressed(page, 'Active');
});

test('Completed filter shows only completed todos and is pressed', async ({ page }) => {
  await setupThree(page);
  await filter(page, 'Completed').click();
  await expect(items(page)).toHaveText(['Walk dog']);
  await expectPressed(page, 'Completed');
});

test('All filter shows every todo again and is pressed', async ({ page }) => {
  await setupThree(page);
  await filter(page, 'Completed').click();
  await expect(items(page)).toHaveText(['Walk dog']);
  await filter(page, 'All').click();
  await expect(items(page)).toHaveText(['Buy milk', 'Walk dog', 'Pay rent']);
  await expectPressed(page, 'All');
});

test('Clear completed is hidden until a todo is completed and hidden again when none is', async ({
  page,
}) => {
  await addTodos(page, ['Buy milk']);
  await expect(itemsLeft(page, '1 item left')).toBeVisible();
  await expect(clearCompleted(page)).toBeHidden();

  await checkbox(page, 'Buy milk').check();
  await expect(itemsLeft(page, '0 items left')).toBeVisible();
  await expect(clearCompleted(page)).toBeVisible();

  await checkbox(page, 'Buy milk').uncheck();
  await expect(itemsLeft(page, '1 item left')).toBeVisible();
  await expect(clearCompleted(page)).toBeHidden();
});

test('Clear completed removes every completed todo and keeps active ones', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Buy milk').check();
  await checkbox(page, 'Pay rent').check();
  await expect(itemsLeft(page, '1 item left')).toBeVisible();

  await clearCompleted(page).click();

  await expect(items(page)).toHaveText(['Walk dog']);
  await expect(itemsLeft(page, '1 item left')).toBeVisible();
  await expect(clearCompleted(page)).toBeHidden();
});
