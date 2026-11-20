// CART-31: TC1, TC2
import { describe, expect, it } from 'vitest';
import { cartTotal } from '../src/cart.js';

describe('cartTotal', () => {
  // CART-31: expected to fail until fixed. A 10-item cart is charged $100 instead of $90 because
  // bulkDiscount (src/cart.js) requires more than BULK_THRESHOLD items rather than at least that many.
  // Remove `.fails` once the fix lands.
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
});
