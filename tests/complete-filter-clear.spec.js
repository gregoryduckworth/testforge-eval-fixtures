// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6
import { expect, test } from '@playwright/test';

async function addTodos(page, titles) {
  for (const title of titles) {
    await page.getByLabel('What needs doing?').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
  }
  await expect(todoList(page)).toHaveCount(titles.length);
  for (const [i, title] of titles.entries()) {
    await expect(todoTitleAt(page, i, title)).toBeVisible();
  }
}

function todoList(page) {
  return page.getByRole('list', { name: 'Todos' }).getByRole('listitem');
}

function todoTitleAt(page, i, title) {
  return todoList(page).nth(i).getByText(title, { exact: true });
}

function todoText(page, title) {
  return todoList(page).filter({ has: page.getByText(title, { exact: true }) }).getByText(title, { exact: true });
}

async function expectPressed(page, pressed) {
  for (const name of ['All', 'Active', 'Completed']) {
    await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute(
      'aria-pressed',
      String(name === pressed),
    );
  }
}

const threeTodos = ['Buy milk', 'Walk dog', 'Pay rent'];

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('ticking a todo strikes it through and lowers the count, unticking reverses both', async ({ page }) => {
  await addTodos(page, ['Buy milk', 'Walk dog']);
  const milk = page.getByRole('checkbox', { name: 'Buy milk', exact: true });
  await expect(page.getByText('2 items left', { exact: true })).toBeVisible();
  await expect(todoText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');

  await milk.check();
  await expect(milk).toBeChecked();
  await expect(todoText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(todoText(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();

  await milk.uncheck();
  await expect(milk).not.toBeChecked();
  await expect(todoText(page, 'Buy milk')).toHaveCSS('text-decoration-line', 'none');
  await expect(todoText(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('2 items left', { exact: true })).toBeVisible();
});

test("Active filter shows only todos that aren't completed and is shown as pressed", async ({ page }) => {
  await addTodos(page, threeTodos);
  await page.getByRole('checkbox', { name: 'Walk dog', exact: true }).check();
  await page.getByRole('button', { name: 'Active', exact: true }).click();
  await expect(todoList(page)).toHaveCount(2);
  await expect(todoTitleAt(page, 0, 'Buy milk')).toBeVisible();
  await expect(todoTitleAt(page, 1, 'Pay rent')).toBeVisible();
  await expectPressed(page, 'Active');
});

test('Completed filter shows only completed todos and is shown as pressed', async ({ page }) => {
  await addTodos(page, threeTodos);
  await page.getByRole('checkbox', { name: 'Walk dog', exact: true }).check();
  await page.getByRole('button', { name: 'Completed', exact: true }).click();
  await expect(todoList(page)).toHaveCount(1);
  await expect(todoTitleAt(page, 0, 'Walk dog')).toBeVisible();
  await expectPressed(page, 'Completed');
});

test('All filter shows every todo again after another filter and is shown as pressed', async ({ page }) => {
  await addTodos(page, threeTodos);
  await page.getByRole('checkbox', { name: 'Walk dog', exact: true }).check();
  await expectPressed(page, 'All');
  await expect(todoList(page)).toHaveCount(3);
  await expect(todoTitleAt(page, 0, 'Buy milk')).toBeVisible();
  await expect(todoTitleAt(page, 1, 'Walk dog')).toBeVisible();
  await expect(todoTitleAt(page, 2, 'Pay rent')).toBeVisible();

  await page.getByRole('button', { name: 'Completed', exact: true }).click();
  await expect(todoList(page)).toHaveCount(1);
  await expect(todoTitleAt(page, 0, 'Walk dog')).toBeVisible();
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(todoList(page)).toHaveCount(3);
  await expect(todoTitleAt(page, 0, 'Buy milk')).toBeVisible();
  await expect(todoTitleAt(page, 1, 'Walk dog')).toBeVisible();
  await expect(todoTitleAt(page, 2, 'Pay rent')).toBeVisible();
  await expectPressed(page, 'All');
});

test('Clear completed is hidden while no todo is completed', async ({ page }) => {
  const clear = page.getByRole('button', { name: 'Clear completed', exact: true });
  await expect(clear).toBeHidden();

  await addTodos(page, ['Buy milk']);
  await expect(clear).toBeHidden();

  const milk = page.getByRole('checkbox', { name: 'Buy milk', exact: true });
  await milk.check();
  await expect(clear).toBeVisible();

  await milk.uncheck();
  await expect(clear).toBeHidden();
});

test('Clear completed removes every completed todo and keeps active ones', async ({ page }) => {
  await addTodos(page, threeTodos);
  await page.getByRole('checkbox', { name: 'Buy milk', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Pay rent', exact: true }).check();
  await page.getByRole('button', { name: 'Clear completed', exact: true }).click();
  await expect(todoList(page)).toHaveCount(1);
  await expect(todoTitleAt(page, 0, 'Walk dog')).toBeVisible();
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Clear completed', exact: true })).toBeHidden();
});
