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

const items = (page) => page.getByRole('list', { name: 'Todos' }).getByRole('listitem');
const box = (page, title) => page.getByRole('checkbox', { name: title, exact: true });
const title = (page, text) => page.getByRole('list', { name: 'Todos' }).getByText(text, { exact: true });
const filterButton = (page, name) => page.getByRole('navigation', { name: 'Filter' }).getByRole('button', { name, exact: true });
// The count is the footer's only paragraph; it has no role or test id of its own.
const count = (page) => page.locator('footer').getByRole('paragraph');
const clearButton = (page) => page.getByRole('button', { name: 'Clear completed', exact: true });

async function expectPressed(page, pressed) {
  for (const name of ['All', 'Active', 'Completed']) {
    await expect(filterButton(page, name)).toHaveAttribute('aria-pressed', String(name === pressed));
  }
}

test('ticking a todo strikes it through and lowers the items left count', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await expect(count(page)).toHaveText('2 items left');

  await box(page, 'Buy milk').check();

  await expect(box(page, 'Buy milk')).toBeChecked();
  await expect(title(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(title(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(count(page)).toHaveText('1 item left');
});

test('unticking a completed todo removes the strike-through and restores the count', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await box(page, 'Buy milk').check();
  await expect(count(page)).toHaveText('1 item left');

  await box(page, 'Buy milk').uncheck();

  await expect(box(page, 'Buy milk')).not.toBeChecked();
  await expect(title(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');
  await expect(count(page)).toHaveText('2 items left');
});

const three = ['Buy milk', 'Walk dog', 'Pay rent'];

test("Active filter shows only todos that aren't completed and is shown as pressed", async ({ page }) => {
  await addTodos(page, three);
  await box(page, 'Walk dog').check();

  await filterButton(page, 'Active').click();

  await expect(items(page)).toHaveText(['Buy milk', 'Pay rent']);
  await expectPressed(page, 'Active');
});

test('Completed filter shows only completed todos and is shown as pressed', async ({ page }) => {
  await addTodos(page, three);
  await box(page, 'Walk dog').check();

  await filterButton(page, 'Completed').click();

  await expect(items(page)).toHaveText(['Walk dog']);
  await expectPressed(page, 'Completed');
});

test('All filter shows every todo again after another filter and is shown as pressed', async ({ page }) => {
  await addTodos(page, three);
  await box(page, 'Walk dog').check();
  await filterButton(page, 'Completed').click();
  await expect(items(page)).toHaveText(['Walk dog']);

  await filterButton(page, 'All').click();

  await expect(items(page)).toHaveText(three);
  await expectPressed(page, 'All');
});

test('Clear completed is hidden while no todo is completed', async ({ page }) => {
  await addTodos(page, ['Buy milk']);
  await expect(clearButton(page)).toBeHidden();

  await box(page, 'Buy milk').check();
  await expect(clearButton(page)).toBeVisible();

  await box(page, 'Buy milk').uncheck();
  await expect(clearButton(page)).toBeHidden();
});

test('Clear completed removes every completed todo and keeps active ones', async ({ page }) => {
  await addTodos(page, three);
  await box(page, 'Buy milk').check();
  await box(page, 'Pay rent').check();

  await clearButton(page).click();

  await expect(items(page)).toHaveText(['Walk dog']);
  await expect(count(page)).toHaveText('1 item left');
  await expect(clearButton(page)).toBeHidden();
});
