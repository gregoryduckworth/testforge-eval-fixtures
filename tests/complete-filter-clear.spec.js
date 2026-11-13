// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7
import { expect, test } from '@playwright/test';

const todoList = (page) => page.getByRole('list', { name: 'Todos', exact: true });
const todoItems = (page) => todoList(page).getByRole('listitem');
const titleOf = (page, title) => todoList(page).getByText(title, { exact: true });
const checkboxOf = (page, title) => todoList(page).getByRole('checkbox', { name: title, exact: true });
const itemsLeft = (page) => page.getByText(/^\d+ items? left$/);
const clearCompleted = (page) => page.getByRole('button', { name: 'Clear completed', exact: true });
const filterButton = (page, name) =>
  page.getByRole('navigation', { name: 'Filter', exact: true }).getByRole('button', { name, exact: true });

async function addTodos(page, titles) {
  await page.goto('/');
  for (const title of titles) {
    await page.getByLabel('What needs doing?', { exact: true }).fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(titleOf(page, title)).toBeVisible();
  }
  await expect(todoItems(page)).toHaveCount(titles.length);
}

test('ticking a todo strikes it through and decrements the items left count', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent']);
  await expect(itemsLeft(page)).toHaveText('2 items left');

  await checkboxOf(page, 'Walk dog').check();

  await expect(checkboxOf(page, 'Walk dog')).toBeChecked();
  await expect(titleOf(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(titleOf(page, 'Pay rent')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page)).toHaveText('1 item left');
});

test('unticking a completed todo removes the strike-through and increments the items left count', async ({
  page,
}) => {
  await addTodos(page, ['Walk dog', 'Pay rent']);
  await checkboxOf(page, 'Walk dog').check();
  await expect(titleOf(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(itemsLeft(page)).toHaveText('1 item left');

  await checkboxOf(page, 'Walk dog').uncheck();

  await expect(checkboxOf(page, 'Walk dog')).not.toBeChecked();
  await expect(titleOf(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page)).toHaveText('2 items left');
});

test('Active filter shows only uncompleted todos and is pressed', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent', 'Water plants']);
  await checkboxOf(page, 'Pay rent').check();
  await expect(checkboxOf(page, 'Pay rent')).toBeChecked();

  await filterButton(page, 'Active').click();

  await expect(todoItems(page)).toHaveCount(2);
  await expect(titleOf(page, 'Walk dog')).toBeVisible();
  await expect(titleOf(page, 'Water plants')).toBeVisible();
  await expect(titleOf(page, 'Pay rent')).toHaveCount(0);
  await expect(filterButton(page, 'Active')).toHaveAttribute('aria-pressed', 'true');
  await expect(filterButton(page, 'All')).toHaveAttribute('aria-pressed', 'false');
  await expect(filterButton(page, 'Completed')).toHaveAttribute('aria-pressed', 'false');
});

test('Completed filter shows only completed todos and is pressed', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent', 'Water plants']);
  await checkboxOf(page, 'Pay rent').check();
  await expect(checkboxOf(page, 'Pay rent')).toBeChecked();

  await filterButton(page, 'Completed').click();

  await expect(todoItems(page)).toHaveCount(1);
  await expect(titleOf(page, 'Pay rent')).toBeVisible();
  await expect(titleOf(page, 'Walk dog')).toHaveCount(0);
  await expect(titleOf(page, 'Water plants')).toHaveCount(0);
  await expect(filterButton(page, 'Completed')).toHaveAttribute('aria-pressed', 'true');
  await expect(filterButton(page, 'All')).toHaveAttribute('aria-pressed', 'false');
  await expect(filterButton(page, 'Active')).toHaveAttribute('aria-pressed', 'false');
});

test('All filter shows every todo again and is pressed', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent', 'Water plants']);
  await checkboxOf(page, 'Pay rent').check();
  await filterButton(page, 'Completed').click();
  await expect(todoItems(page)).toHaveCount(1);

  await filterButton(page, 'All').click();

  await expect(todoItems(page)).toHaveCount(3);
  await expect(titleOf(page, 'Walk dog')).toBeVisible();
  await expect(titleOf(page, 'Pay rent')).toBeVisible();
  await expect(titleOf(page, 'Water plants')).toBeVisible();
  await expect(filterButton(page, 'All')).toHaveAttribute('aria-pressed', 'true');
  await expect(filterButton(page, 'Active')).toHaveAttribute('aria-pressed', 'false');
  await expect(filterButton(page, 'Completed')).toHaveAttribute('aria-pressed', 'false');
});

test('Clear completed is hidden until a todo is completed and hidden again when it is unticked', async ({
  page,
}) => {
  await addTodos(page, ['Walk dog', 'Pay rent']);
  await expect(itemsLeft(page)).toHaveText('2 items left');
  await expect(clearCompleted(page)).toBeHidden();

  await checkboxOf(page, 'Walk dog').check();
  await expect(itemsLeft(page)).toHaveText('1 item left');
  await expect(clearCompleted(page)).toBeVisible();

  await checkboxOf(page, 'Walk dog').uncheck();
  await expect(itemsLeft(page)).toHaveText('2 items left');
  await expect(clearCompleted(page)).toBeHidden();
});

test('Clear completed removes every completed todo and keeps active ones', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent', 'Water plants']);
  await checkboxOf(page, 'Walk dog').check();
  await checkboxOf(page, 'Water plants').check();
  await expect(itemsLeft(page)).toHaveText('1 item left');

  await clearCompleted(page).click();

  await expect(todoItems(page)).toHaveCount(1);
  await expect(titleOf(page, 'Pay rent')).toBeVisible();
  await expect(titleOf(page, 'Walk dog')).toHaveCount(0);
  await expect(titleOf(page, 'Water plants')).toHaveCount(0);
  await expect(itemsLeft(page)).toHaveText('1 item left');
  await expect(clearCompleted(page)).toBeHidden();
});
