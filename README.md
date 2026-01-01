# Kettle & Co.

A small tea shop: a catalogue, a page per product, a cart and a checkout that places an order.

- `npm start` serves it on `PORT` (4175 by default). `GET /health` says whether it is up.
- The cart lives in a `cart` cookie in the browser; placing an order (`POST /orders`) is the only
  request that changes anything on the server. Every request is logged as `METHOD /path status`.
- `npm run test:e2e` runs the Playwright tests. They start the shop themselves, or run against a
  deployed build when `BASE_URL` is set.

Each release is deployed to staging, then to production.
