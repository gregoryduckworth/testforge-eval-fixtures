// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7
import { expect, test } from '@playwright/test';

const MILK = 'Buy milk';
const DOG = 'Walk dog';
const RENT = 'Pay rent';

async function addTodos(page, titles) {
  await page.goto('/');
  for (const title of titles) {
    await page.getByLabel('What needs doing?').fill(title);
    await page.getByRole('button', { name: 'Add' }).click();
  }
  await expect(todoItems(page)).toHaveText(titles);
}

function todoItems(page) {
  return page.getByRole('list', { name: 'Todos' }).getByRole('listitem');
}

function checkbox(page, title) {
  return page.getByRole('checkbox', { name: title, exact: true });
}

function title(page, text) {
  return page.getByRole('list', { name: 'Todos' }).getByText(text, { exact: true });
}

async function expectPressed(page, pressed) {
  for (const name of ['All', 'Active', 'Completed']) {
    await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute(
      'aria-pressed',
      String(name === pressed),
    );
  }
}

test('ticking a todo strikes it through and lowers the items left count', async ({ page }) => {
  await addTodos(page, [MILK, DOG]);
  await expect(page.getByText('2 items left')).toBeVisible();

  await checkbox(page, MILK).check();

  await expect(checkbox(page, MILK)).toBeChecked();
  await expect(title(page, MILK)).toHaveCSS('text-decoration-line', 'line-through');
  await expect(title(page, DOG)).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('1 item left')).toBeVisible();
});

test('unticking a completed todo removes the strike-through and restores the count', async ({ page }) => {
  await addTodos(page, [MILK, DOG]);
  await checkbox(page, MILK).check();
  await expect(page.getByText('1 item left')).toBeVisible();

  await checkbox(page, MILK).uncheck();

  await expect(checkbox(page, MILK)).not.toBeChecked();
  await expect(title(page, MILK)).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('2 items left')).toBeVisible();
});

test("Active filter shows only todos that aren't completed and is pressed", async ({ page }) => {
  await addTodos(page, [MILK, DOG, RENT]);
  await checkbox(page, DOG).check();

  await page.getByRole('button', { name: 'Active', exact: true }).click();

  await expect(todoItems(page)).toHaveText([MILK, RENT]);
  await expectPressed(page, 'Active');
});

test('Completed filter shows only completed todos and is pressed', async ({ page }) => {
  await addTodos(page, [MILK, DOG, RENT]);
  await checkbox(page, DOG).check();

  await page.getByRole('button', { name: 'Completed', exact: true }).click();

  await expect(todoItems(page)).toHaveText([DOG]);
  await expectPressed(page, 'Completed');
});

test('All filter shows every todo again and is pressed', async ({ page }) => {
  await addTodos(page, [MILK, DOG, RENT]);
  await checkbox(page, DOG).check();
  await page.getByRole('button', { name: 'Completed', exact: true }).click();
  await expect(todoItems(page)).toHaveText([DOG]);

  await page.getByRole('button', { name: 'All', exact: true }).click();

  await expect(todoItems(page)).toHaveText([MILK, DOG, RENT]);
  await expectPressed(page, 'All');
});

test('Clear completed removes every completed todo and then hides', async ({ page }) => {
  await addTodos(page, [MILK, DOG, RENT]);
  await checkbox(page, MILK).check();
  await checkbox(page, RENT).check();

  await page.getByRole('button', { name: 'Clear completed' }).click();

  await expect(todoItems(page)).toHaveText([DOG]);
  await expect(page.getByText('1 item left')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Clear completed' })).toBeHidden();
});

test('Clear completed is hidden while no todo is completed', async ({ page }) => {
  const clear = page.getByRole('button', { name: 'Clear completed' });
  await addTodos(page, [MILK]);
  await expect(clear).toBeHidden();

  await checkbox(page, MILK).check();
  await expect(clear).toBeVisible();

  await checkbox(page, MILK).uncheck();
  await expect(clear).toBeHidden();
});
