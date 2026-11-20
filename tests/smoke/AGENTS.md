# Smoke tests

Fast, read-only Playwright checks that a build of the shop works at all.

- Run: `npm run test:smoke` (`playwright test --grep @smoke`). Install a browser once with
  `npx playwright install chromium`.
- Target: with `BASE_URL` set, the tests hit that deployed build. Without it, `playwright.config.js`
  starts `node src/server.js` on port 4175.
- `shop.smoke.spec.js` covers `GET /health`, the catalogue, a product page, adding to the cart and
  reaching checkout. Product names and prices come from `src/catalogue.js`, not copies.

Conventions when adding a test:

- Put `@smoke` in every test title. Files here hold only smoke tests.
- Only read: send only GET requests, never submit a form (no orders). The cart is a browser cookie,
  so filling it is fine.
- Use relative paths against `baseURL`, never a host.
- Start each spec with a comment naming the ticket key and the cases it implements.

Not covered: placing an order and the confirmation page (`POST /orders` creates an order), and
error pages.
