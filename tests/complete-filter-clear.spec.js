// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7
import { expect, test } from '@playwright/test';

async function addTodos(page, titles) {
  for (const title of titles) {
    await page.getByLabel('What needs doing?').fill(title);
    await page.getByRole('button', { name: 'Add' }).click();
  }
  await expect(todoItems(page)).toHaveText(titles);
}

function todoItems(page) {
  return page.getByRole('list', { name: 'Todos' }).getByRole('listitem');
}

function todoText(page, title) {
  return page.getByRole('list', { name: 'Todos' }).getByText(title, { exact: true });
}

function filterButton(page, name) {
  return page.getByRole('navigation', { name: 'Filter' }).getByRole('button', { name, exact: true });
}

async function expectPressedFilter(page, pressed) {
  for (const name of ['All', 'Active', 'Completed']) {
    await expect(filterButton(page, name)).toHaveAttribute('aria-pressed', String(name === pressed));
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('ticking a todo strikes it through and decrements the items left count', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await expect(page.getByText('2 items left', { exact: true })).toBeVisible();

  await page.getByRole('checkbox', { name: 'Buy milk', exact: true }).check();

  await expect(page.getByRole('checkbox', { name: 'Buy milk', exact: true })).toBeChecked();
  await expect(todoText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(todoText(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
});

test('unticking a completed todo removes the strike-through and restores the items left count', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await page.getByRole('checkbox', { name: 'Buy milk', exact: true }).check();
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();

  await page.getByRole('checkbox', { name: 'Buy milk', exact: true }).uncheck();

  await expect(page.getByRole('checkbox', { name: 'Buy milk', exact: true })).not.toBeChecked();
  await expect(todoText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('2 items left', { exact: true })).toBeVisible();
});

test('Active filter shows only todos that are not completed and is shown as pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await page.getByRole('checkbox', { name: 'Walk dog', exact: true }).check();

  await filterButton(page, 'Active').click();

  await expect(todoItems(page)).toHaveText(['Buy milk', 'Pay rent']);
  await expectPressedFilter(page, 'Active');
});

test('Completed filter shows only completed todos and is shown as pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await page.getByRole('checkbox', { name: 'Walk dog', exact: true }).check();

  await filterButton(page, 'Completed').click();

  await expect(todoItems(page)).toHaveText(['Walk dog']);
  await expectPressedFilter(page, 'Completed');
});

test('All filter shows every todo again after another filter and is shown as pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await page.getByRole('checkbox', { name: 'Walk dog', exact: true }).check();
  await filterButton(page, 'Completed').click();
  await expect(todoItems(page)).toHaveText(['Walk dog']);

  await filterButton(page, 'All').click();

  await expect(todoItems(page)).toHaveText(['Buy milk', 'Walk dog', 'Pay rent']);
  await expectPressedFilter(page, 'All');
});

test('Clear completed is shown only while a todo is completed', async ({ page }) => {
  const clearCompleted = page.getByRole('button', { name: 'Clear completed', exact: true });
  await addTodos(page, ['Buy milk']);
  await expect(clearCompleted).toBeHidden();

  await page.getByRole('checkbox', { name: 'Buy milk', exact: true }).check();
  await expect(clearCompleted).toBeVisible();

  await page.getByRole('checkbox', { name: 'Buy milk', exact: true }).uncheck();
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
  await expect(clearCompleted).toBeHidden();
});

test('Clear completed removes every completed todo and keeps active ones', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await page.getByRole('checkbox', { name: 'Buy milk', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Pay rent', exact: true }).check();

  await page.getByRole('button', { name: 'Clear completed', exact: true }).click();

  await expect(todoItems(page)).toHaveText(['Walk dog']);
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Clear completed', exact: true })).toBeHidden();
});
