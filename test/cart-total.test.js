// CART-31: TC1, TC2, TC3
import { describe, expect, it } from 'vitest';
import { cartTotal } from '../src/cart.js';

describe('cartTotal', () => {
  // CART-31: expected to fail until fixed — a 10-item cart is charged $100 instead of $90
  // (bulkDiscount uses `> BULK_THRESHOLD` rather than `>=`). Remove `.fails` once it is fixed.
  it.fails('applies the bulk discount to a cart of exactly 10 items', () => {
    const total = cartTotal([{ price: 10, quantity: 10 }]);

    expect(total).toBe(90);
  });

  it('never lets SAVE5 take a $3 cart below $0 for the goods', () => {
    const total = cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' });

    expect(total).toBe(4.99);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    const total = cartTotal([{ price: 10, quantity: 9 }]);

    expect(total).toBe(90);
  });
});
