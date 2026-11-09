// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7
import { expect, test } from '@playwright/test';

async function addTodos(page, titles) {
  await page.goto('/');
  for (const title of titles) {
    await page.getByLabel('What needs doing?').fill(title);
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByRole('checkbox', { name: title, exact: true })).toBeVisible();
  }
}

function todoText(page, title) {
  return page
    .getByRole('list', { name: 'Todos' })
    .getByRole('listitem')
    .filter({ hasText: title })
    .getByText(title, { exact: true });
}

function filterButton(page, name) {
  return page.getByRole('navigation', { name: 'Filter' }).getByRole('button', { name, exact: true });
}

async function expectPressed(page, pressed) {
  for (const name of ['All', 'Active', 'Completed']) {
    await expect(filterButton(page, name)).toHaveAttribute('aria-pressed', String(name === pressed));
  }
}

test('ticking a todo strikes it through and lowers the items left count', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await expect(page.getByText('2 items left', { exact: true })).toBeVisible();

  await page.getByRole('checkbox', { name: 'Buy milk', exact: true }).check();

  await expect(page.getByRole('checkbox', { name: 'Buy milk', exact: true })).toBeChecked();
  await expect(todoText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(todoText(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
});

test('unticking a completed todo removes the strike-through and restores the count', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await page.getByRole('checkbox', { name: 'Buy milk', exact: true }).check();
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();

  await page.getByRole('checkbox', { name: 'Buy milk', exact: true }).uncheck();

  await expect(page.getByRole('checkbox', { name: 'Buy milk', exact: true })).not.toBeChecked();
  await expect(todoText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('2 items left', { exact: true })).toBeVisible();
});

test('Active filter shows only uncompleted todos and is pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await page.getByRole('checkbox', { name: 'Walk dog', exact: true }).check();

  await filterButton(page, 'Active').click();

  await expect(page.getByRole('list', { name: 'Todos' }).getByRole('listitem')).toHaveText(['Buy milk', 'Pay rent']);
  await expectPressed(page, 'Active');
});

test('Completed filter shows only completed todos and is pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await page.getByRole('checkbox', { name: 'Walk dog', exact: true }).check();

  await filterButton(page, 'Completed').click();

  await expect(page.getByRole('list', { name: 'Todos' }).getByRole('listitem')).toHaveText(['Walk dog']);
  await expectPressed(page, 'Completed');
});

test('All filter shows every todo again and is pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await page.getByRole('checkbox', { name: 'Walk dog', exact: true }).check();
  await filterButton(page, 'Completed').click();
  await expect(page.getByRole('list', { name: 'Todos' }).getByRole('listitem')).toHaveText(['Walk dog']);

  await filterButton(page, 'All').click();

  await expect(page.getByRole('list', { name: 'Todos' }).getByRole('listitem')).toHaveText([
    'Buy milk',
    'Walk dog',
    'Pay rent',
  ]);
  await expectPressed(page, 'All');
});

test('Clear completed is shown only while a todo is completed', async ({ page }) => {
  await addTodos(page, ['Buy milk']);
  const clear = page.getByRole('button', { name: 'Clear completed' });
  await expect(clear).toBeHidden();

  await page.getByRole('checkbox', { name: 'Buy milk', exact: true }).check();
  await expect(clear).toBeVisible();

  await page.getByRole('checkbox', { name: 'Buy milk', exact: true }).uncheck();
  await expect(clear).toBeHidden();
});

test('Clear completed removes every completed todo and keeps active ones', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await page.getByRole('checkbox', { name: 'Buy milk', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Pay rent', exact: true }).check();

  await page.getByRole('button', { name: 'Clear completed' }).click();

  await expect(page.getByRole('list', { name: 'Todos' }).getByRole('listitem')).toHaveText(['Walk dog']);
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Clear completed' })).toBeHidden();
});
