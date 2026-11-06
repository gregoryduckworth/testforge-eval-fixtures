// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8
import { describe, expect, it } from 'vitest';
import { cartTotal } from '../src/cart.js';

describe('cartTotal', () => {
  // Expected product defect: bulkDiscount uses `itemCount > BULK_THRESHOLD`,
  // but the ticket ("10 or more") and the constant's doc comment ("at least")
  // say exactly 10 items qualifies. Remove `.fails` once the code is fixed.
  it.fails('gives 10% off a cart of exactly 10 items spread over several lines', () => {
    const items = [
      { price: 3, quantity: 4 },
      { price: 3, quantity: 6 },
    ];

    expect(cartTotal(items)).toBe(31.99);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    const items = [
      { price: 3, quantity: 4 },
      { price: 3, quantity: 5 },
    ];

    expect(cartTotal(items)).toBe(31.99);
  });

  it('takes SAVE5 off after the bulk discount', () => {
    const items = [{ price: 5, quantity: 12 }];

    expect(cartTotal(items, { coupon: 'SAVE5' })).toBe(53.99);
  });

  it('never prices the goods below $0 when SAVE5 exceeds them', () => {
    const items = [{ price: 3, quantity: 1 }];

    expect(cartTotal(items, { coupon: 'SAVE5' })).toBe(4.99);
  });

  it('refuses an unknown coupon code with an error', () => {
    const items = [{ price: 10, quantity: 1 }];

    expect(() => cartTotal(items, { coupon: 'SAVE10' })).toThrow(Error);
    expect(() => cartTotal(items, { coupon: 'SAVE10' })).toThrow(/SAVE10/);
  });

  it('ships free when the goods cost exactly $50 after discounts', () => {
    const items = [{ price: 27.5, quantity: 2 }];

    expect(cartTotal(items, { coupon: 'SAVE5' })).toBe(50);
  });

  it('charges $4.99 shipping when the goods cost $49.99', () => {
    const items = [{ price: 49.99, quantity: 1 }];

    expect(cartTotal(items)).toBe(54.98);
  });

  it('charges nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });
});
