// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7
import { expect, test } from '@playwright/test';

const todoList = (page) => page.getByRole('list', { name: 'Todos', exact: true });
// Aria snapshot of a list holding exactly these todos, in this order, each named by its checkbox.
function todosSnapshot(titles) {
  const items = titles.map((title) => `  - listitem:\n    - checkbox ${JSON.stringify(title)}`).join('\n');
  return `- list "Todos":\n  - /children: equal\n${items}`;
}
const titleOf = (page, title) => todoList(page).getByText(title, { exact: true });
const checkboxOf = (page, title) => todoList(page).getByRole('checkbox', { name: title, exact: true });
// #count has no role or test id; see the follow-up to give it one.
const itemsLeft = (page) => page.locator('#count');
const filterButton = (page, name) =>
  page.getByRole('navigation', { name: 'Filter', exact: true }).getByRole('button', { name, exact: true });
const clearCompleted = (page) => page.getByRole('button', { name: 'Clear completed', exact: true });

async function addTodos(page, titles) {
  await page.goto('/');
  for (const title of titles) {
    await page.getByLabel('What needs doing?', { exact: true }).fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(titleOf(page, title)).toBeVisible();
  }
}

async function expectPressed(page, pressed) {
  await expect(filterButton(page, 'All')).toHaveAttribute('aria-pressed', String(pressed === 'All'));
  await expect(filterButton(page, 'Active')).toHaveAttribute('aria-pressed', String(pressed === 'Active'));
  await expect(filterButton(page, 'Completed')).toHaveAttribute('aria-pressed', String(pressed === 'Completed'));
}

test('ticking a todo strikes it through and lowers the items left count by one', async ({ page }) => {
  await addTodos(page, ['Walk the dog', 'Pay rent']);
  await expect(itemsLeft(page)).toHaveText('2 items left');

  await checkboxOf(page, 'Walk the dog').check();

  await expect(checkboxOf(page, 'Walk the dog')).toBeChecked();
  await expect(titleOf(page, 'Walk the dog')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(titleOf(page, 'Pay rent')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page)).toHaveText('1 item left');
});

test('unticking a completed todo removes the strike-through and restores the items left count', async ({ page }) => {
  await addTodos(page, ['Walk the dog', 'Pay rent']);
  await checkboxOf(page, 'Walk the dog').check();
  await expect(itemsLeft(page)).toHaveText('1 item left');

  await checkboxOf(page, 'Walk the dog').uncheck();

  await expect(checkboxOf(page, 'Walk the dog')).not.toBeChecked();
  await expect(titleOf(page, 'Walk the dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page)).toHaveText('2 items left');
});

test('Active filter shows only uncompleted todos and is pressed', async ({ page }) => {
  await addTodos(page, ['Walk the dog', 'Pay rent', 'Water plants']);
  await checkboxOf(page, 'Pay rent').check();
  await expect(checkboxOf(page, 'Pay rent')).toBeChecked();

  await filterButton(page, 'Active').click();

  await expect(todoList(page)).toMatchAriaSnapshot(todosSnapshot(['Walk the dog', 'Water plants']));
  await expectPressed(page, 'Active');
});

test('Completed filter shows only completed todos and is pressed', async ({ page }) => {
  await addTodos(page, ['Walk the dog', 'Pay rent', 'Water plants']);
  await checkboxOf(page, 'Pay rent').check();
  await expect(checkboxOf(page, 'Pay rent')).toBeChecked();

  await filterButton(page, 'Completed').click();

  await expect(todoList(page)).toMatchAriaSnapshot(todosSnapshot(['Pay rent']));
  await expectPressed(page, 'Completed');
});

test('All filter shows every todo in order and is pressed after switching back', async ({ page }) => {
  await addTodos(page, ['Walk the dog', 'Pay rent', 'Water plants']);
  await checkboxOf(page, 'Pay rent').check();
  await filterButton(page, 'Completed').click();
  await expect(todoList(page)).toMatchAriaSnapshot(todosSnapshot(['Pay rent']));

  await filterButton(page, 'All').click();

  await expect(todoList(page)).toMatchAriaSnapshot(todosSnapshot(['Walk the dog', 'Pay rent', 'Water plants']));
  await expectPressed(page, 'All');
});

test('Clear completed is hidden until a todo is completed and hidden again when it is unticked', async ({ page }) => {
  await addTodos(page, ['Walk the dog']);
  await expect(todoList(page)).toMatchAriaSnapshot(todosSnapshot(['Walk the dog']));
  await expect(clearCompleted(page)).toBeHidden();

  await checkboxOf(page, 'Walk the dog').check();
  await expect(clearCompleted(page)).toBeVisible();

  await checkboxOf(page, 'Walk the dog').uncheck();
  await expect(checkboxOf(page, 'Walk the dog')).not.toBeChecked();
  await expect(clearCompleted(page)).toBeHidden();
});

test('Clear completed removes every completed todo and keeps the active ones', async ({ page }) => {
  await addTodos(page, ['Walk the dog', 'Pay rent', 'Water plants']);
  await checkboxOf(page, 'Walk the dog').check();
  await checkboxOf(page, 'Water plants').check();
  await expect(itemsLeft(page)).toHaveText('1 item left');

  await clearCompleted(page).click();

  await expect(todoList(page)).toMatchAriaSnapshot(todosSnapshot(['Pay rent']));
  await expect(itemsLeft(page)).toHaveText('1 item left');
  await expect(clearCompleted(page)).toBeHidden();
});
