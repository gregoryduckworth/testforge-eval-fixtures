// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7
import { expect, test } from '@playwright/test';

async function addTodos(page, titles) {
  await page.goto('/');
  for (const title of titles) {
    await page.getByLabel('What needs doing?', { exact: true }).fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(items(page).filter({ has: page.getByText(title, { exact: true }) })).toHaveCount(1);
  }
}

function items(page) {
  return page.getByRole('list', { name: 'Todos', exact: true }).getByRole('listitem');
}

function titleText(page, title) {
  return items(page).filter({ has: page.getByText(title, { exact: true }) }).getByText(title, { exact: true });
}

function checkbox(page, title) {
  return page.getByRole('checkbox', { name: title, exact: true });
}

function filterButton(page, name) {
  return page.getByRole('navigation', { name: 'Filter', exact: true }).getByRole('button', { name, exact: true });
}

async function expectPressed(page, pressed) {
  for (const name of ['All', 'Active', 'Completed']) {
    await expect(filterButton(page, name)).toHaveAttribute('aria-pressed', String(name === pressed));
  }
}

const clearButton = (page) => page.getByRole('button', { name: 'Clear completed', exact: true });

test('ticking a todo strikes it through and decrements the items left count', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await expect(page.getByText('2 items left', { exact: true })).toBeVisible();
  await checkbox(page, 'Buy milk').check();
  await expect(checkbox(page, 'Buy milk')).toBeChecked();
  await expect(titleText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(titleText(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
});

test('unticking a completed todo removes the strike-through and restores the count', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await checkbox(page, 'Buy milk').check();
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
  await checkbox(page, 'Buy milk').uncheck();
  await expect(checkbox(page, 'Buy milk')).not.toBeChecked();
  await expect(titleText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('2 items left', { exact: true })).toBeVisible();
});

test('Active filter shows only uncompleted todos and is shown as pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();
  await filterButton(page, 'Active').click();
  await expect(items(page)).toHaveText(['Buy milk', 'Pay rent']);
  await expectPressed(page, 'Active');
});

test('Completed filter shows only completed todos and is shown as pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();
  await filterButton(page, 'Completed').click();
  await expect(items(page)).toHaveText(['Walk dog']);
  await expectPressed(page, 'Completed');
});

test('All filter shows every todo again and is shown as pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();
  await filterButton(page, 'Completed').click();
  await expect(items(page)).toHaveText(['Walk dog']);
  await filterButton(page, 'All').click();
  await expect(items(page)).toHaveText(['Buy milk', 'Walk dog', 'Pay rent']);
  await expectPressed(page, 'All');
});

test('Clear completed is hidden until a todo is completed and hidden again when it is unticked', async ({ page }) => {
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
  await expect(items(page)).toHaveText(['Walk dog']);
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
  await expect(clearButton(page)).toBeHidden();
});
