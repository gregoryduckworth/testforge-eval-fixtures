# Smoke tests

A few fast Playwright tests of the shop's critical paths, run against a build before it is deployed further.

## Running

- `npm run test:smoke` runs every test tagged `@smoke` (`playwright test --grep @smoke`).
- Without `BASE_URL`, `playwright.config.js` starts the shop itself on `http://localhost:4175`.
- With `BASE_URL` set, the tests run against that deployed build and start nothing.
- One-off setup: `npx playwright install chromium`.

## Rules for adding a test

- Put `@smoke` in each test's title; this folder holds only smoke tests.
- Start each spec with a comment naming the ticket's key and the strategy cases it implements.
- Only read: make GET requests and keep the cart in the browser's cookie. Never submit the checkout
  form (`POST /orders`) or send any other request that writes data, since the suite runs against production.
- Use relative paths (`page.goto('/cart')`), never a host, so the configured base URL is used.
- Take product names and prices from `src/catalogue.js` (`PRODUCTS`, `findProduct`, `formatPrice`) rather than
  writing them out.
- Find elements by role and exact accessible name; give each assertion a message naming the critical path.

## Covered paths

`GET /health`, the catalogue, a product page, the cart and the checkout page (form shown, not submitted).
Placing an order and its confirmation page write data, so they are left to `tests/checkout.spec.js`.
