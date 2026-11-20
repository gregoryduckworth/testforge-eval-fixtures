// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8
import { expect, test } from '@playwright/test';

const todoList = (page) => page.getByRole('list', { name: 'Todos', exact: true });
// Each todo's title is the only <span> in its list item.
const todoTitles = (page) => todoList(page).getByRole('listitem').locator('span');
const todoTitle = (page, title) => todoList(page).getByText(title, { exact: true });
const checkbox = (page, title) => todoList(page).getByRole('checkbox', { name: title, exact: true });
// The count has no role or test id, so it is found by its exact full text within the page's main region.
const itemsLeft = (page, text) => page.getByRole('main').getByText(text, { exact: true });
const filterButton = (page, name) =>
  page.getByRole('navigation', { name: 'Filter', exact: true }).getByRole('button', { name, exact: true });
const clearCompleted = (page) => page.getByRole('button', { name: 'Clear completed', exact: true });

async function addTodos(page, titles) {
  await page.goto('/');
  for (const title of titles) {
    await page.getByLabel('What needs doing?', { exact: true }).fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
  }
  await expect(todoTitles(page)).toHaveText(titles);
}

async function expectPressed(page, selected) {
  for (const name of ['All', 'Active', 'Completed']) {
    await expect(filterButton(page, name)).toHaveAttribute('aria-pressed', String(name === selected));
  }
}

test('ticking a todo strikes it through and decrements the items left', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent']);
  await expect(itemsLeft(page, '2 items left')).toBeVisible();

  await checkbox(page, 'Walk dog').check();

  await expect(checkbox(page, 'Walk dog')).toBeChecked();
  await expect(todoTitle(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(todoTitle(page, 'Pay rent')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page, '1 item left')).toBeVisible();
});

test('unticking a completed todo removes the strike-through and restores the items left', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();
  await expect(itemsLeft(page, '1 item left')).toBeVisible();

  await checkbox(page, 'Walk dog').uncheck();

  await expect(checkbox(page, 'Walk dog')).not.toBeChecked();
  await expect(todoTitle(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page, '2 items left')).toBeVisible();
});

test('Active filter shows only todos that are not completed and is pressed', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent', 'Call mum']);
  await checkbox(page, 'Pay rent').check();

  await filterButton(page, 'Active').click();

  await expect(todoTitles(page)).toHaveText(['Walk dog', 'Call mum']);
  await expectPressed(page, 'Active');
});

test('Completed filter shows only completed todos and is pressed', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent', 'Call mum']);
  await checkbox(page, 'Pay rent').check();

  await filterButton(page, 'Completed').click();

  await expect(todoTitles(page)).toHaveText(['Pay rent']);
  await expectPressed(page, 'Completed');
});

test('All filter shows every todo in order after another filter and is pressed', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent', 'Call mum']);
  await checkbox(page, 'Pay rent').check();
  await filterButton(page, 'Completed').click();
  await expect(todoTitles(page)).toHaveText(['Pay rent']);

  await filterButton(page, 'All').click();

  await expect(todoTitles(page)).toHaveText(['Walk dog', 'Pay rent', 'Call mum']);
  await expectPressed(page, 'All');
});

test('ticking a todo under the Active filter removes it from the view', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent']);
  await filterButton(page, 'Active').click();
  await expectPressed(page, 'Active');

  // click(), not check(): the ticked row is re-rendered away, so check() can't confirm the box.
  await checkbox(page, 'Walk dog').click();

  await expect(todoTitles(page)).toHaveText(['Pay rent']);
  await expect(itemsLeft(page, '1 item left')).toBeVisible();
});

test('Clear completed is hidden until a todo is completed and hides again when it is unticked', async ({ page }) => {
  await addTodos(page, ['Walk dog']);
  await expect(clearCompleted(page)).toBeHidden();

  await checkbox(page, 'Walk dog').check();
  await expect(clearCompleted(page)).toBeVisible();

  await checkbox(page, 'Walk dog').uncheck();
  await expect(clearCompleted(page)).toBeHidden();
});

test('Clear completed removes every completed todo and keeps the active ones', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent', 'Call mum', 'Buy bread']);
  await checkbox(page, 'Walk dog').check();
  await checkbox(page, 'Call mum').check();
  await expect(itemsLeft(page, '2 items left')).toBeVisible();

  await clearCompleted(page).click();

  await expect(todoTitles(page)).toHaveText(['Pay rent', 'Buy bread']);
  await expect(itemsLeft(page, '2 items left')).toBeVisible();
  await expect(clearCompleted(page)).toBeHidden();
});
