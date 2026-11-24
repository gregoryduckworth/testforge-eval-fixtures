// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7
import { expect, test } from '@playwright/test';

/** Opens a fresh list (todos live only in page memory) and adds the given titles. */
async function addTodos(page, titles) {
  await page.goto('/');
  for (const title of titles) {
    await page.getByLabel('What needs doing?').fill(title);
    await page.getByRole('button', { name: 'Add' }).click();
  }
  await expect(todoList(page).getByRole('listitem')).toHaveText(titles);
}

function todoList(page) {
  return page.getByRole('list', { name: 'Todos' });
}

function checkbox(page, title) {
  return todoList(page).getByRole('checkbox', { name: title, exact: true });
}

function todoTitle(page, title) {
  return todoList(page).getByText(title, { exact: true });
}

function itemsLeft(page) {
  return page.getByText(/^\d+ items? left$/);
}

function filterButton(page, name) {
  return page.getByRole('navigation', { name: 'Filter' }).getByRole('button', { name, exact: true });
}

function clearCompleted(page) {
  return page.getByRole('button', { name: 'Clear completed', exact: true });
}

async function expectPressedFilter(page, pressed) {
  for (const name of ['All', 'Active', 'Completed']) {
    await expect(filterButton(page, name)).toHaveAttribute('aria-pressed', String(name === pressed));
  }
}

test('ticking a todo strikes it through and decrements items left', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await expect(itemsLeft(page)).toHaveText('2 items left');
  await expect(todoTitle(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');

  await checkbox(page, 'Buy milk').check();

  await expect(checkbox(page, 'Buy milk')).toBeChecked();
  await expect(todoTitle(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(todoTitle(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page)).toHaveText('1 item left');
});

test('unticking a completed todo removes the strike-through and restores items left', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  await checkbox(page, 'Buy milk').check();
  await expect(itemsLeft(page)).toHaveText('1 item left');
  await expect(todoTitle(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');

  await checkbox(page, 'Buy milk').uncheck();

  await expect(checkbox(page, 'Buy milk')).not.toBeChecked();
  await expect(todoTitle(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');
  await expect(itemsLeft(page)).toHaveText('2 items left');
});

test.describe('filters', () => {
  test.beforeEach(async ({ page }) => {
    await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
    await checkbox(page, 'Buy milk').check();
    await expect(checkbox(page, 'Buy milk')).toBeChecked();
  });

  test('Active filter shows only todos that are not completed and is pressed', async ({ page }) => {
    await filterButton(page, 'Active').click();

    await expect(todoList(page).getByRole('listitem')).toHaveText(['Walk dog', 'Pay rent']);
    await expectPressedFilter(page, 'Active');
  });

  test('Completed filter shows only completed todos and is pressed', async ({ page }) => {
    await filterButton(page, 'Completed').click();

    await expect(todoList(page).getByRole('listitem')).toHaveText(['Buy milk']);
    await expectPressedFilter(page, 'Completed');
  });

  test('All filter shows every todo again and is pressed', async ({ page }) => {
    await filterButton(page, 'Completed').click();
    await expect(todoList(page).getByRole('listitem')).toHaveText(['Buy milk']);

    await filterButton(page, 'All').click();

    await expect(todoList(page).getByRole('listitem')).toHaveText(['Buy milk', 'Walk dog', 'Pay rent']);
    await expectPressedFilter(page, 'All');
  });
});

test('Clear completed is shown only while a todo is completed', async ({ page }) => {
  await addTodos(page, ['Buy milk']);
  await expect(itemsLeft(page)).toHaveText('1 item left');
  await expect(clearCompleted(page)).toBeHidden();

  await checkbox(page, 'Buy milk').check();
  await expect(clearCompleted(page)).toBeVisible();

  await checkbox(page, 'Buy milk').uncheck();
  await expect(itemsLeft(page)).toHaveText('1 item left');
  await expect(clearCompleted(page)).toBeHidden();
});

test('Clear completed removes every completed todo and keeps active ones', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog', 'Pay rent']);
  await checkbox(page, 'Buy milk').check();
  await checkbox(page, 'Pay rent').check();
  await expect(itemsLeft(page)).toHaveText('1 item left');

  await clearCompleted(page).click();

  await expect(todoList(page).getByRole('listitem')).toHaveText(['Walk dog']);
  await expect(itemsLeft(page)).toHaveText('1 item left');
  await expect(clearCompleted(page)).toBeHidden();
});
