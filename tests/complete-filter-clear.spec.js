// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8
import { expect, test } from '@playwright/test';

async function addTodos(page, ...titles) {
  await page.goto('/');
  for (const title of titles) {
    await page.getByLabel('What needs doing?', { exact: true }).fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByRole('checkbox', { name: title, exact: true })).toBeVisible();
  }
}

const items = (page) => page.getByRole('list', { name: 'Todos' }).getByRole('listitem');
const box = (page, title) => page.getByRole('checkbox', { name: title, exact: true });
const title = (page, text) => page.getByRole('list', { name: 'Todos' }).getByText(text, { exact: true });
const filterButton = (page, name) => page.getByRole('button', { name, exact: true });
const clearButton = (page) => page.getByRole('button', { name: 'Clear completed', exact: true });

async function expectPressed(page, pressed) {
  for (const name of ['All', 'Active', 'Completed']) {
    await expect(filterButton(page, name)).toHaveAttribute('aria-pressed', name === pressed ? 'true' : 'false');
  }
}

test('ticking a todo strikes it through and lowers the items left count', async ({ page }) => {
  await addTodos(page, 'Buy milk', 'Walk dog');
  await expect(page.getByText('2 items left', { exact: true })).toBeVisible();
  await box(page, 'Buy milk').check();
  await expect(box(page, 'Buy milk')).toBeChecked();
  await expect(title(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(title(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
});

test('unticking a completed todo removes the strike-through and restores the count', async ({ page }) => {
  await addTodos(page, 'Buy milk', 'Walk dog');
  await box(page, 'Buy milk').check();
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
  await box(page, 'Buy milk').uncheck();
  await expect(box(page, 'Buy milk')).not.toBeChecked();
  await expect(title(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('2 items left', { exact: true })).toBeVisible();
});

test('Active filter shows only todos that are not completed and is pressed', async ({ page }) => {
  await addTodos(page, 'Buy milk', 'Walk dog');
  await box(page, 'Buy milk').check();
  await filterButton(page, 'Active').click();
  await expect(items(page)).toHaveText(['Walk dog']);
  await expectPressed(page, 'Active');
});

test('Completed filter shows only completed todos and is pressed', async ({ page }) => {
  await addTodos(page, 'Buy milk', 'Walk dog');
  await box(page, 'Buy milk').check();
  await filterButton(page, 'Completed').click();
  await expect(items(page)).toHaveText(['Buy milk']);
  await expectPressed(page, 'Completed');
});

test('All filter shows every todo again and is pressed', async ({ page }) => {
  await addTodos(page, 'Buy milk', 'Walk dog');
  await box(page, 'Buy milk').check();
  await filterButton(page, 'Completed').click();
  await expect(items(page)).toHaveText(['Buy milk']);
  await expectPressed(page, 'Completed');
  await filterButton(page, 'All').click();
  await expect(items(page)).toHaveText(['Buy milk', 'Walk dog']);
  await expectPressed(page, 'All');
});

test('Clear completed is shown only while a todo is completed', async ({ page }) => {
  await addTodos(page, 'Buy milk');
  await expect(items(page)).toHaveText(['Buy milk']);
  await expect(clearButton(page)).toBeHidden();
  await box(page, 'Buy milk').check();
  await expect(clearButton(page)).toBeVisible();
  await box(page, 'Buy milk').uncheck();
  await expect(clearButton(page)).toBeHidden();
});

test('Clear completed removes every completed todo and keeps active ones', async ({ page }) => {
  await addTodos(page, 'Buy milk', 'Walk dog', 'Pay rent');
  await box(page, 'Buy milk').check();
  await box(page, 'Pay rent').check();
  await clearButton(page).click();
  await expect(items(page)).toHaveText(['Walk dog']);
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
  await expect(clearButton(page)).toBeHidden();
});

test('ticking a todo while the Active filter is selected removes it from the list', async ({ page }) => {
  await addTodos(page, 'Buy milk', 'Walk dog');
  await filterButton(page, 'Active').click();
  await expect(items(page)).toHaveText(['Buy milk', 'Walk dog']);
  // click rather than check(): the todo leaves the list on ticking, so check() can't verify the state
  await box(page, 'Buy milk').click();
  await expect(items(page)).toHaveText(['Walk dog']);
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
});
