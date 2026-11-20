// CART-31: TC1, TC2, TC3
import { describe, expect, it } from 'vitest';
import { cartTotal } from '../src/cart.js';

describe('cartTotal', () => {
  // CART-31: expected to fail until fixed. bulkDiscount (src/cart.js) uses `> BULK_THRESHOLD`,
  // so 10 items get no discount and cost 100 instead of 90. Remove `.fails` once fixed.
  it.fails('applies the bulk discount to a cart of exactly 10 items', () => {
    const items = [{ price: 10, quantity: 10 }];

    const total = cartTotal(items);

    expect(total).toBe(90);
  });

  it('charges only shipping when SAVE5 exceeds a $3 cart', () => {
    const items = [{ price: 3, quantity: 1 }];

    const total = cartTotal(items, { coupon: 'SAVE5' });

    expect(total).toBe(4.99);
  });

  it('applies the bulk discount to 11 items spread over two lines', () => {
    const items = [
      { price: 10, quantity: 5 },
      { price: 10, quantity: 6 },
    ];

    const total = cartTotal(items);

    expect(total).toBe(99);
  });
});
