# tea-shop-pricing

How the tea shop prices a basket: line totals, the spend and bulk discounts, coupons and how amounts are shown. Amounts are whole pence.

- Spend £50 or more: 5% off.
- Buy 10 or more items: 10% off, when that's more.
- Coupons come off after that: `SAVE10` (10% off) and `TENOFF` (£10 off, never below zero).

```bash
npm install
npm test
```
