# products-api

A small JSON API over an in-memory product catalogue.

```bash
npm install
npm start   # http://localhost:3100, or PORT
npm test
```

## Endpoints

- `GET /products?q=<text>&limit=<n>&offset=<n>`: products whose name contains `q` (any case), by id.
  `limit` defaults to 20, up to 100.
- `GET /products/:id`: one product, or 404.
- `POST /orders` with `{ "productId": number, "quantity": number }`: 201 with the order.
