# orders

Prices orders: their lines, shipping and the prices shown to customers.

```bash
npm install
npm test
```

## API

- `subtotal(lines)` and `orderTotal(lines)` (`src/orders.js`): an order's goods, and what the
  customer pays with shipping, in cents.
- `shippingFor(subtotal)` (`src/shipping.js`): shipping in cents for the goods' cost.
- `formatPrice(cents, currency)` (`src/money.js`): a price as customers see it.
- `inStock(lines, stock)` and `shortages(lines, stock)` (`src/stock.js`): whether the stock covers
  an order, and what it is short of.
