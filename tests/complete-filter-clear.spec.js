// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8
import { expect, test } from '@playwright/test';

const todoList = (page) => page.getByRole('list', { name: 'Todos', exact: true });
// A todo's list item holds only its checkbox and title, so its text is exactly the title.
const titles = (page) => todoList(page).getByRole('listitem');
const title = (page, name) => todoList(page).getByText(name, { exact: true });
const checkbox = (page, name) => todoList(page).getByRole('checkbox', { name, exact: true });
// #count has no role or test id (see follow-ups); its text is matched exactly.
const itemsLeft = (page) => page.locator('#count');
const filterButton = (page, name) =>
  page.getByRole('navigation', { name: 'Filter', exact: true }).getByRole('button', { name, exact: true });
const clearCompleted = (page) => page.getByRole('button', { name: 'Clear completed', exact: true });

async function addTodos(page, names) {
  await page.goto('/');
  for (const name of names) {
    await page.getByLabel('What needs doing?', { exact: true }).fill(name);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
  }
  await expect(titles(page)).toHaveText(names);
}

test('ticking a todo strikes it through and lowers the items-left count by one', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await expect(title(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page)).toHaveText('2 items left');

  await checkbox(page, 'Buy milk').check();

  await expect(checkbox(page, 'Buy milk')).toBeChecked();
  await expect(title(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(title(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page)).toHaveText('1 item left');
});

test('unticking a completed todo removes the strike-through and raises the count again', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await checkbox(page, 'Buy milk').check();
  await expect(title(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(itemsLeft(page)).toHaveText('1 item left');

  await checkbox(page, 'Buy milk').uncheck();

  await expect(checkbox(page, 'Buy milk')).not.toBeChecked();
  await expect(title(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page)).toHaveText('2 items left');
});

test("Active filter shows only todos that aren't completed and is shown as pressed", async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();

  await filterButton(page, 'Active').click();

  await expect(titles(page)).toHaveText(['Buy milk', 'Pay rent']);
  await expect(filterButton(page, 'Active')).toHaveAttribute('aria-pressed', 'true');
  await expect(filterButton(page, 'All')).toHaveAttribute('aria-pressed', 'false');
  await expect(filterButton(page, 'Completed')).toHaveAttribute('aria-pressed', 'false');
});

test('Completed filter shows only completed todos and is shown as pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();

  await filterButton(page, 'Completed').click();

  await expect(titles(page)).toHaveText(['Walk dog']);
  await expect(filterButton(page, 'Completed')).toHaveAttribute('aria-pressed', 'true');
  await expect(filterButton(page, 'All')).toHaveAttribute('aria-pressed', 'false');
  await expect(filterButton(page, 'Active')).toHaveAttribute('aria-pressed', 'false');
});

test('All filter shows every todo in order and is shown as pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();
  await filterButton(page, 'Completed').click();
  await expect(titles(page)).toHaveText(['Walk dog']);

  await filterButton(page, 'All').click();

  await expect(titles(page)).toHaveText(['Buy milk', 'Walk dog', 'Pay rent']);
  await expect(filterButton(page, 'All')).toHaveAttribute('aria-pressed', 'true');
  await expect(filterButton(page, 'Active')).toHaveAttribute('aria-pressed', 'false');
  await expect(filterButton(page, 'Completed')).toHaveAttribute('aria-pressed', 'false');
});

test('ticking a todo under the Active filter removes it from the view', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await filterButton(page, 'Active').click();
  await expect(filterButton(page, 'Active')).toHaveAttribute('aria-pressed', 'true');

  // click(), not check(): the re-render removes the box, so check() can't confirm it.
  await checkbox(page, 'Buy milk').click();

  await expect(titles(page)).toHaveText(['Walk dog']);
  await expect(itemsLeft(page)).toHaveText('1 item left');
});

test('Clear completed is hidden until a todo is completed and hidden again once it is unticked', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await expect(itemsLeft(page)).toHaveText('2 items left');
  await expect(clearCompleted(page)).toBeHidden();

  await checkbox(page, 'Buy milk').check();
  await expect(itemsLeft(page)).toHaveText('1 item left');
  await expect(clearCompleted(page)).toBeVisible();

  await checkbox(page, 'Buy milk').uncheck();
  await expect(itemsLeft(page)).toHaveText('2 items left');
  await expect(clearCompleted(page)).toBeHidden();
});

test('Clear completed removes every completed todo and keeps the active ones', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Buy milk').check();
  await checkbox(page, 'Pay rent').check();
  await expect(itemsLeft(page)).toHaveText('1 item left');

  await clearCompleted(page).click();

  await expect(titles(page)).toHaveText(['Walk dog']);
  await expect(itemsLeft(page)).toHaveText('1 item left');
  await expect(clearCompleted(page)).toBeHidden();
});
