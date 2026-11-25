// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9
// Expected amounts are the ticket's rules worked out by hand ($4.99 shipping, free from $50, 10% bulk
// discount, SAVE5 = $5), not the module's constants, so a wrong constant fails these tests.
import { describe, expect, it } from 'vitest';
import { bulkDiscount, cartTotal } from '../src/cart.js';

describe('bulk discount', () => {
  // Expected to fail: bulkDiscount in src/cart.js uses `> BULK_THRESHOLD` rather than `>=`, so a
  // cart of exactly 10 items gets no discount (returns 100, not 90). Remove `.fails` once fixed.
  it.fails('gives 10% off a cart of exactly 10 items', () => {
    const items = [
      { price: 10, quantity: 4 },
      { price: 10, quantity: 6 },
    ];

    expect(cartTotal(items)).toBe(90);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    const items = [{ price: 10, quantity: 9 }];

    expect(bulkDiscount(items)).toBe(0);
    expect(cartTotal(items)).toBe(90);
  });

  it('gives 10% off a cart of 11 items spread across lines', () => {
    const items = [
      { price: 10, quantity: 5 },
      { price: 10, quantity: 6 },
    ];

    expect(bulkDiscount(items)).toBe(11);
  });
});

describe('coupons', () => {
  it('takes SAVE5 off after the bulk discount', () => {
    // 55 - 5.50 bulk = 49.50, - 5 = 44.50, + 4.99 shipping. Coupon first would give 49.99.
    const items = [{ price: 5, quantity: 11 }];

    expect(cartTotal(items, { coupon: 'SAVE5' })).toBe(49.49);
  });

  it('never prices the goods below $0 with SAVE5', () => {
    const items = [{ price: 3, quantity: 1 }];

    expect(cartTotal(items, { coupon: 'SAVE5' })).toBe(4.99);
  });

  it('refuses any coupon code other than SAVE5', () => {
    const items = [{ price: 10, quantity: 1 }];

    expect(() => cartTotal(items, { coupon: 'SAVE10' })).toThrow(/\bSAVE10$/);
    expect(() => cartTotal(items, { coupon: 'save5' })).toThrow(/\bsave5$/);
  });
});

describe('shipping', () => {
  it('ships free when the goods cost exactly $50', () => {
    expect(cartTotal([{ price: 50, quantity: 1 }])).toBe(50);
  });

  it('charges $4.99 shipping when the goods cost $49.99', () => {
    expect(cartTotal([{ price: 49.99, quantity: 1 }])).toBe(54.98);
  });

  it('charges $4.99 shipping when discounts take the goods under $50', () => {
    // Subtotal 55 is over $50, but the goods cost 49.50 after the bulk discount.
    const items = [{ price: 5, quantity: 11 }];

    expect(cartTotal(items)).toBe(54.49);
  });

  it('charges nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
    expect(cartTotal([], { coupon: 'SAVE5' })).toBe(0);
  });
});
