// TODO-7: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8
import { expect, test } from '@playwright/test';

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

function titleText(page, title) {
  return todoItems(page).getByText(title, { exact: true });
}

async function expectPressed(page, pressed) {
  for (const name of ['All', 'Active', 'Completed']) {
    await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute(
      'aria-pressed',
      String(name === pressed),
    );
  }
}

const clearButton = (page) => page.getByRole('button', { name: 'Clear completed', exact: true });

test('ticking a todo strikes it through and decrements items left', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent']);
  await expect(page.getByText('2 items left')).toBeVisible();
  await expect(titleText(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');

  await checkbox(page, 'Walk dog').check();

  await expect(checkbox(page, 'Walk dog')).toBeChecked();
  await expect(titleText(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(titleText(page, 'Pay rent')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('1 item left')).toBeVisible();
});

test('unticking a completed todo removes the strike-through and restores items left', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent']);
  await checkbox(page, 'Walk dog').check();
  await expect(page.getByText('1 item left')).toBeVisible();

  await checkbox(page, 'Walk dog').uncheck();

  await expect(checkbox(page, 'Walk dog')).not.toBeChecked();
  await expect(titleText(page, 'Walk dog')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByText('2 items left')).toBeVisible();
});

test('Active filter shows only todos that are not completed and is pressed', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent', 'Water plants']);
  await checkbox(page, 'Pay rent').check();

  await page.getByRole('button', { name: 'Active', exact: true }).click();

  await expect(todoItems(page)).toHaveText(['Walk dog', 'Water plants']);
  await expectPressed(page, 'Active');
});

test('Completed filter shows only completed todos and is pressed', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent', 'Water plants']);
  await checkbox(page, 'Pay rent').check();

  await page.getByRole('button', { name: 'Completed', exact: true }).click();

  await expect(todoItems(page)).toHaveText(['Pay rent']);
  await expectPressed(page, 'Completed');
});

test('All filter shows every todo again and is pressed', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent', 'Water plants']);
  await checkbox(page, 'Pay rent').check();
  await page.getByRole('button', { name: 'Completed', exact: true }).click();
  await expect(todoItems(page)).toHaveText(['Pay rent']);

  await page.getByRole('button', { name: 'All', exact: true }).click();

  await expect(todoItems(page)).toHaveText(['Walk dog', 'Pay rent', 'Water plants']);
  await expectPressed(page, 'All');
});

test('Clear completed is hidden while no todo is completed', async ({ page }) => {
  await addTodos(page, ['Walk dog']);
  await expect(clearButton(page)).toBeHidden();

  await checkbox(page, 'Walk dog').check();
  await expect(clearButton(page)).toBeVisible();

  await checkbox(page, 'Walk dog').uncheck();
  await expect(clearButton(page)).toBeHidden();
});

test('Clear completed removes every completed todo and keeps active ones', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent', 'Water plants']);
  await checkbox(page, 'Walk dog').check();
  await checkbox(page, 'Water plants').check();

  await clearButton(page).click();

  await expect(todoItems(page)).toHaveText(['Pay rent']);
  await expect(page.getByText('1 item left')).toBeVisible();
  await expect(clearButton(page)).toBeHidden();
});

test('completing a todo while the Active filter is selected removes it from the view', async ({ page }) => {
  await addTodos(page, ['Walk dog', 'Pay rent']);
  await page.getByRole('button', { name: 'Active', exact: true }).click();

  // click(), not check(): the todo leaves the Active view as soon as it is ticked, so check() can't re-read its state.
  await checkbox(page, 'Walk dog').click();

  await expect(todoItems(page)).toHaveText(['Pay rent']);
  await expectPressed(page, 'Active');
  await expect(page.getByText('1 item left')).toBeVisible();
  await expect(clearButton(page)).toBeVisible();
});
