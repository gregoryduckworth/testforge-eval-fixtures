# pricing

What an order costs: its items, a coupon and shipping.

- Shipping is free for a subtotal of $50 or more, and $4.99 below that.
- The coupon `SAVE20` takes 20% off a subtotal over $100. Any other code, or none, changes nothing.
- The total is the discounted subtotal plus its shipping, rounded to the cent.

`npm test` runs the tests with Vitest.
