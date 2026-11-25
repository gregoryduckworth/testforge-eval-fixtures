// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7
import { expect, test } from '@playwright/test';

/** @param {import('@playwright/test').Page} page @param {string[]} titles */
async function addTodos(page, titles) {
  await page.goto('/');
  for (const title of titles) {
    await page.getByLabel('What needs doing?').fill(title);
    await page.getByRole('button', { name: 'Add' }).click();
  }
  await expect(todoItems(page)).toHaveText(titles);
}

/** @param {import('@playwright/test').Page} page */
function todoItems(page) {
  return page.getByRole('list', { name: 'Todos' }).getByRole('listitem');
}

/** @param {import('@playwright/test').Page} page @param {string} title */
function checkbox(page, title) {
  return page.getByRole('list', { name: 'Todos' }).getByRole('checkbox', { name: title, exact: true });
}

/** @param {import('@playwright/test').Page} page @param {string} title */
function todoTitle(page, title) {
  return todoItems(page)
    .filter({ has: page.getByRole('checkbox', { name: title, exact: true }) })
    .getByText(title, { exact: true });
}

/** @param {import('@playwright/test').Page} page @param {string} name */
function filterButton(page, name) {
  return page.getByRole('navigation', { name: 'Filter' }).getByRole('button', { name, exact: true });
}

/**
 * The footer paragraph that shows "N item(s) left"; todos render as list items, never paragraphs.
 * @param {import('@playwright/test').Page} page
 */
function itemsLeft(page) {
  return page
    .getByRole('main')
    .getByRole('paragraph')
    .filter({ hasText: /^\d+ items? left$/ });
}

/** @param {import('@playwright/test').Page} page */
function clearCompleted(page) {
  return page.getByRole('button', { name: 'Clear completed', exact: true });
}

/** @param {import('@playwright/test').Page} page @param {'All' | 'Active' | 'Completed'} pressed */
async function expectPressed(page, pressed) {
  for (const name of ['All', 'Active', 'Completed']) {
    await expect(filterButton(page, name)).toHaveAttribute('aria-pressed', String(name === pressed));
  }
}

test('ticking a todo strikes it through and lowers the items left count', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await expect(itemsLeft(page)).toHaveText('2 items left');

  await checkbox(page, 'Buy milk').check();

  await expect(checkbox(page, 'Buy milk')).toBeChecked();
  await expect(todoTitle(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(todoTitle(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page)).toHaveText('1 item left');
});

test('unticking a completed todo removes the strike-through and restores the count', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await checkbox(page, 'Buy milk').check();
  await expect(itemsLeft(page)).toHaveText('1 item left');
  await expect(todoTitle(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');

  await checkbox(page, 'Buy milk').uncheck();

  await expect(checkbox(page, 'Buy milk')).not.toBeChecked();
  await expect(todoTitle(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page)).toHaveText('2 items left');
});

test('Active filter shows only uncompleted todos and is pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Buy milk').check();
  await expect(checkbox(page, 'Buy milk')).toBeChecked();

  await filterButton(page, 'Active').click();

  await expect(todoItems(page)).toHaveText(['Walk dog', 'Pay rent']);
  await expectPressed(page, 'Active');
});

test('Completed filter shows only completed todos and is pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Buy milk').check();
  await expect(checkbox(page, 'Buy milk')).toBeChecked();

  await filterButton(page, 'Completed').click();

  await expect(todoItems(page)).toHaveText(['Buy milk']);
  await expectPressed(page, 'Completed');
});

test('All filter shows every todo again and is pressed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Buy milk').check();
  await filterButton(page, 'Completed').click();
  await expect(todoItems(page)).toHaveText(['Buy milk']);

  await filterButton(page, 'All').click();

  await expect(todoItems(page)).toHaveText(['Buy milk', 'Walk dog', 'Pay rent']);
  await expectPressed(page, 'All');
});

test('Clear completed is hidden while no todo is completed', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  const clear = clearCompleted(page);
  await expect(clear).toBeHidden();

  await checkbox(page, 'Buy milk').check();
  await expect(clear).toBeVisible();

  await checkbox(page, 'Buy milk').uncheck();
  await expect(checkbox(page, 'Buy milk')).not.toBeChecked();
  await expect(clear).toBeHidden();
});

test('Clear completed removes every completed todo and keeps active ones', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Buy milk').check();
  await checkbox(page, 'Pay rent').check();
  await expect(itemsLeft(page)).toHaveText('1 item left');
  const clear = clearCompleted(page);

  await clear.click();

  await expect(todoItems(page)).toHaveText(['Walk dog']);
  await expect(checkbox(page, 'Walk dog')).not.toBeChecked();
  await expect(itemsLeft(page)).toHaveText('1 item left');
  await expect(clear).toBeHidden();
});
