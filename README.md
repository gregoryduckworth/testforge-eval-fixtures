# orders-api

A small orders API. `npm start` serves it on port 4310 (`PORT` to change it); `npm test` runs its tests.

## Endpoints

- `GET /health`: `{ status, version }`.
- `GET /orders`: every order, with its number of lines and its total in cents.
- `GET /orders/:id`: one order, with its lines (product, name, quantity, price) and its total; 404 when there is none.
- `GET /search?q=<customer>&limit=20&offset=0`: the orders of the customers whose name contains `q`, a page at a time, with the total found.

## Load scripts

The scripts in `perf/` run with [k6](https://k6.io) against the app: `k6 run perf/orders.js` (the order list and an order's page) and `k6 run perf/search.js`, with `BASE_URL` to point them elsewhere.
