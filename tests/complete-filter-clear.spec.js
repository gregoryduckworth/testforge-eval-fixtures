// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7
import { expect, test } from '@playwright/test';

const TITLES = ['Buy milk', 'Walk dog', 'Pay rent'];

async function addTodos(page, titles) {
  await page.goto('/');
  const list = page.getByRole('list', { name: 'Todos' });
  for (const title of titles) {
    await page.getByLabel('What needs doing?').fill(title);
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(list.getByText(title, { exact: true })).toBeVisible();
  }
}

function todoBox(page, title) {
  return page.getByRole('checkbox', { name: title, exact: true });
}

function todoText(page, title) {
  return page.getByRole('list', { name: 'Todos' }).getByText(title, { exact: true });
}

async function expectPressed(page, pressed) {
  const filters = page.getByRole('navigation', { name: 'Filter' });
  for (const name of ['All', 'Active', 'Completed']) {
    await expect(filters.getByRole('button', { name, exact: true })).toHaveAttribute(
      'aria-pressed',
      String(name === pressed),
    );
  }
}

test('ticking a todo strikes it through and decreases the items left count', async ({ page }) => {
  await addTodos(page, TITLES);
  await expect(page.getByText('3 items left', { exact: true })).toBeVisible();
  await expect(todoText(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');

  await todoBox(page, 'Walk dog').check();

  await expect(todoBox(page, 'Walk dog')).toBeChecked();
  await expect(todoText(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(todoText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');
  await expect(todoText(page, 'Pay rent')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('2 items left', { exact: true })).toBeVisible();
});

test('unticking a completed todo removes the strike-through and restores the items left count', async ({ page }) => {
  await addTodos(page, TITLES);
  await todoBox(page, 'Walk dog').check();
  await expect(page.getByText('2 items left', { exact: true })).toBeVisible();

  await todoBox(page, 'Walk dog').uncheck();

  await expect(todoBox(page, 'Walk dog')).not.toBeChecked();
  await expect(todoText(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('3 items left', { exact: true })).toBeVisible();
});

test('Active filter shows only todos that are not completed and is shown as pressed', async ({ page }) => {
  await addTodos(page, TITLES);
  await todoBox(page, 'Walk dog').check();

  await page.getByRole('button', { name: 'Active', exact: true }).click();

  await expect(page.getByRole('list', { name: 'Todos' }).getByRole('listitem')).toHaveText(['Buy milk', 'Pay rent']);
  await expectPressed(page, 'Active');
});

test('Completed filter shows only completed todos and is shown as pressed', async ({ page }) => {
  await addTodos(page, TITLES);
  await todoBox(page, 'Walk dog').check();

  await page.getByRole('button', { name: 'Completed', exact: true }).click();

  await expect(page.getByRole('list', { name: 'Todos' }).getByRole('listitem')).toHaveText(['Walk dog']);
  await expectPressed(page, 'Completed');
});

test('All filter shows every todo and is shown as pressed after switching back', async ({ page }) => {
  await addTodos(page, TITLES);
  await todoBox(page, 'Walk dog').check();

  await page.getByRole('button', { name: 'Completed', exact: true }).click();
  await expect(page.getByRole('list', { name: 'Todos' }).getByRole('listitem')).toHaveText(['Walk dog']);
  await page.getByRole('button', { name: 'All', exact: true }).click();

  await expect(page.getByRole('list', { name: 'Todos' }).getByRole('listitem')).toHaveText(TITLES);
  await expectPressed(page, 'All');
});

test('Clear completed is hidden while no todo is completed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  const clear = page.getByRole('button', { name: 'Clear completed', exact: true });
  await expect(clear).toBeHidden();

  await todoBox(page, 'Buy milk').check();
  await expect(clear).toBeVisible();

  await todoBox(page, 'Buy milk').uncheck();
  await expect(clear).toBeHidden();
});

test('Clear completed removes every completed todo and keeps active ones', async ({ page }) => {
  await addTodos(page, TITLES);
  await todoBox(page, 'Buy milk').check();
  await todoBox(page, 'Pay rent').check();

  await page.getByRole('button', { name: 'Clear completed', exact: true }).click();

  await expect(page.getByRole('list', { name: 'Todos' }).getByRole('listitem')).toHaveText(['Walk dog']);
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Clear completed', exact: true })).toBeHidden();
});
