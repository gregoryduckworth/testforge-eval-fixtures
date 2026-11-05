// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7
import { expect, test } from '@playwright/test';

async function addTodos(page, titles) {
  await page.goto('/');
  for (const title of titles) {
    await page.getByLabel('What needs doing?').fill(title);
    await page.getByRole('button', { name: 'Add' }).click();
  }
  await expect(page.getByRole('list', { name: 'Todos' }).getByRole('listitem')).toHaveText(titles);
}

const todoList = (page) => page.getByRole('list', { name: 'Todos' }).getByRole('listitem');
const checkbox = (page, title) => page.getByRole('checkbox', { name: title, exact: true });
const filterButton = (page, name) => page.getByRole('navigation', { name: 'Filter' }).getByRole('button', { name, exact: true });
const clearButton = (page) => page.getByRole('button', { name: 'Clear completed', exact: true });
const titleText = (page, title) => page.getByText(title, { exact: true });

test('ticking a todo strikes it through and decrements items left', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await expect(page.getByText('2 items left')).toBeVisible();

  await checkbox(page, 'Buy milk').check();

  await expect(checkbox(page, 'Buy milk')).toBeChecked();
  await expect(titleText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(titleText(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('1 item left')).toBeVisible();
});

test('unticking a completed todo removes the strike-through and restores items left', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await checkbox(page, 'Buy milk').check();
  await expect(page.getByText('1 item left')).toBeVisible();

  await checkbox(page, 'Buy milk').uncheck();

  await expect(checkbox(page, 'Buy milk')).not.toBeChecked();
  await expect(titleText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('2 items left')).toBeVisible();
});

test("Active filter shows only todos that aren't completed and is pressed", async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await checkbox(page, 'Buy milk').check();

  await filterButton(page, 'Active').click();

  await expect(todoList(page)).toHaveText(['Walk dog']);
  await expect(filterButton(page, 'Active')).toHaveAttribute('aria-pressed', 'true');
  await expect(filterButton(page, 'All')).toHaveAttribute('aria-pressed', 'false');
  await expect(filterButton(page, 'Completed')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByText('1 item left')).toBeVisible();
});

test('Completed filter shows only completed todos and is pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await checkbox(page, 'Buy milk').check();

  await filterButton(page, 'Completed').click();

  await expect(todoList(page)).toHaveText(['Buy milk']);
  await expect(filterButton(page, 'Completed')).toHaveAttribute('aria-pressed', 'true');
  await expect(filterButton(page, 'All')).toHaveAttribute('aria-pressed', 'false');
  await expect(filterButton(page, 'Active')).toHaveAttribute('aria-pressed', 'false');
});

test('All filter shows every todo again and is pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await checkbox(page, 'Buy milk').check();
  await filterButton(page, 'Completed').click();
  await expect(todoList(page)).toHaveText(['Buy milk']);

  await filterButton(page, 'All').click();

  await expect(todoList(page)).toHaveText(['Buy milk', 'Walk dog']);
  await expect(filterButton(page, 'All')).toHaveAttribute('aria-pressed', 'true');
  await expect(filterButton(page, 'Active')).toHaveAttribute('aria-pressed', 'false');
  await expect(filterButton(page, 'Completed')).toHaveAttribute('aria-pressed', 'false');
});

test('Clear completed is hidden while no todo is completed', async ({ page }) => {
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

  await expect(todoList(page)).toHaveText(['Walk dog']);
  await expect(page.getByText('1 item left')).toBeVisible();
  await expect(clearButton(page)).toBeHidden();
});
