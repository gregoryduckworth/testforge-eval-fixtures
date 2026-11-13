// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8
import { expect, test } from '@playwright/test';

const todoList = (page) => page.getByRole('list', { name: 'Todos', exact: true });
const todoTitle = (page, title) => todoList(page).getByText(title, { exact: true });
const checkbox = (page, title) => todoList(page).getByRole('checkbox', { name: title, exact: true });
const itemsLeft = (page) => page.locator('#count');
const filterButton = (page, name) =>
  page.getByRole('navigation', { name: 'Filter', exact: true }).getByRole('button', { name, exact: true });
const clearCompleted = (page) => page.getByRole('button', { name: 'Clear completed', exact: true });

async function addTodos(page, titles) {
  await page.goto('/');
  for (const title of titles) {
    await page.getByLabel('What needs doing?', { exact: true }).fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(todoTitle(page, title)).toBeVisible();
  }
}

test('ticking a todo strikes it through and decreases items left by one', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent']);
  await expect(itemsLeft(page)).toHaveText('2 items left');

  await checkbox(page, 'Walk dog').check();

  await expect(todoTitle(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(todoTitle(page, 'Pay rent')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page)).toHaveText('1 item left');
});

test('unticking a completed todo removes the strike-through and restores items left', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();
  await expect(itemsLeft(page)).toHaveText('1 item left');

  await checkbox(page, 'Walk dog').uncheck();

  await expect(checkbox(page, 'Walk dog')).not.toBeChecked();
  await expect(todoTitle(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page)).toHaveText('2 items left');
});

test('Active filter shows only uncompleted todos and is pressed', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent', 'Call mum']);
  await checkbox(page, 'Pay rent').check();

  await filterButton(page, 'Active').click();

  await expect(todoList(page).getByRole('listitem')).toHaveCount(2);
  await expect(todoTitle(page, 'Walk dog')).toBeVisible();
  await expect(todoTitle(page, 'Call mum')).toBeVisible();
  await expect(todoTitle(page, 'Pay rent')).toHaveCount(0);
  await expect(filterButton(page, 'Active')).toHaveAttribute('aria-pressed', 'true');
  await expect(filterButton(page, 'All')).toHaveAttribute('aria-pressed', 'false');
  await expect(filterButton(page, 'Completed')).toHaveAttribute('aria-pressed', 'false');
});

test('Completed filter shows only completed todos and is pressed', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent', 'Call mum']);
  await checkbox(page, 'Pay rent').check();

  await filterButton(page, 'Completed').click();

  await expect(todoList(page).getByRole('listitem')).toHaveCount(1);
  await expect(todoTitle(page, 'Pay rent')).toBeVisible();
  await expect(todoTitle(page, 'Walk dog')).toHaveCount(0);
  await expect(todoTitle(page, 'Call mum')).toHaveCount(0);
  await expect(filterButton(page, 'Completed')).toHaveAttribute('aria-pressed', 'true');
  await expect(filterButton(page, 'All')).toHaveAttribute('aria-pressed', 'false');
  await expect(filterButton(page, 'Active')).toHaveAttribute('aria-pressed', 'false');
});

test('All filter shows every todo again after another filter and is pressed', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent', 'Call mum']);
  await checkbox(page, 'Pay rent').check();
  await filterButton(page, 'Completed').click();
  await expect(todoList(page).getByRole('listitem')).toHaveCount(1);

  await filterButton(page, 'All').click();

  await expect(todoList(page).getByRole('listitem')).toHaveCount(3);
  await expect(todoTitle(page, 'Walk dog')).toBeVisible();
  await expect(todoTitle(page, 'Pay rent')).toBeVisible();
  await expect(todoTitle(page, 'Call mum')).toBeVisible();
  // order in which they were added, read from each row's checkbox label within the list
  const boxes = todoList(page).getByRole('checkbox');
  await expect(boxes.nth(0)).toHaveAccessibleName('Walk dog');
  await expect(boxes.nth(1)).toHaveAccessibleName('Pay rent');
  await expect(boxes.nth(2)).toHaveAccessibleName('Call mum');
  await expect(filterButton(page, 'All')).toHaveAttribute('aria-pressed', 'true');
  await expect(filterButton(page, 'Active')).toHaveAttribute('aria-pressed', 'false');
  await expect(filterButton(page, 'Completed')).toHaveAttribute('aria-pressed', 'false');
});

test('completing a todo under the Active filter removes it from the list', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent']);
  await filterButton(page, 'Active').click();
  await expect(filterButton(page, 'Active')).toHaveAttribute('aria-pressed', 'true');

  // click(), not check(): the app re-renders and drops the row, so check() would re-read a detached box
  await checkbox(page, 'Walk dog').click();

  await expect(todoList(page).getByRole('listitem')).toHaveCount(1);
  await expect(todoTitle(page, 'Pay rent')).toBeVisible();
  await expect(todoTitle(page, 'Walk dog')).toHaveCount(0);
  await expect(itemsLeft(page)).toHaveText('1 item left');
});

test('Clear completed is hidden until a todo is completed and hidden again when it is unticked', async ({ page }) => {
  await addTodos(page, ['Walk dog']);
  await expect(itemsLeft(page)).toHaveText('1 item left');
  await expect(clearCompleted(page)).toBeHidden();

  await checkbox(page, 'Walk dog').check();
  await expect(clearCompleted(page)).toBeVisible();

  await checkbox(page, 'Walk dog').uncheck();
  await expect(itemsLeft(page)).toHaveText('1 item left');
  await expect(clearCompleted(page)).toBeHidden();
});

test('Clear completed removes every completed todo and keeps active ones', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent', 'Call mum']);
  await checkbox(page, 'Walk dog').check();
  await checkbox(page, 'Call mum').check();
  await expect(itemsLeft(page)).toHaveText('1 item left');

  await clearCompleted(page).click();

  await expect(todoList(page).getByRole('listitem')).toHaveCount(1);
  await expect(todoTitle(page, 'Pay rent')).toBeVisible();
  await expect(todoTitle(page, 'Walk dog')).toHaveCount(0);
  await expect(todoTitle(page, 'Call mum')).toHaveCount(0);
  await expect(itemsLeft(page)).toHaveText('1 item left');
  await expect(clearCompleted(page)).toBeHidden();
});
