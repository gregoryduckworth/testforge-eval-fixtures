# Smoke suite

Fast, read-only Playwright checks of the shop's critical paths, run before a build is deployed further.

## Running

- `npm run test:smoke` runs every test tagged `@smoke` (`playwright test --grep @smoke`).
- Without `BASE_URL`, `playwright.config.js` starts the shop (`node src/server.js`) on port 4175.
- With `BASE_URL` set, the tests run against that deployed build instead.
- One-off setup: `npx playwright install --with-deps chromium`.

## Covered

- `GET /health` answers 200 with `{"status":"ok"}`.
- The catalogue lists every product in `src/catalogue.js` with its price.
- A product page opens from the catalogue.
- Adding to the cart (a browser cookie only) shows the product and total on the cart page.
- Checkout opens with the order form for a filled cart.

## Conventions

- Every test only reads: no form submission, no POST/PUT/PATCH/DELETE. Placing an order writes data, so it is
  left to `tests/checkout.spec.js`.
- Put `@smoke` at the end of each test title; this folder holds only smoke tests.
- Use relative URLs (the config's `baseURL`), never a host.
- Take product names and prices from `src/catalogue.js` rather than writing them out.
- Find elements by role and exact accessible name; give each assertion a message naming the critical path.
- Start each spec with a comment naming the ticket's key and the strategy cases it implements.
