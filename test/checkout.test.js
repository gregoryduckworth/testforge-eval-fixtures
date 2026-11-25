// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11
// cartTotal and bulkDiscount round to cents, so exact toBe comparisons are safe here.
import { describe, expect, it } from 'vitest';
import { bulkDiscount, cartTotal } from '../src/cart.js';

describe('bulk discount', () => {
  // Expected to fail: suspected defect, bulkDiscount compares `itemCount > BULK_THRESHOLD`
  // (src/cart.js), so exactly 10 items get no discount though the ticket says "10 or more".
  it.fails('gives 10% off a cart of exactly 10 items spread over several lines', () => {
    const items = [
      { price: 3, quantity: 4 },
      { price: 3, quantity: 6 },
    ];

    expect(bulkDiscount(items)).toBe(3);
    expect(cartTotal(items)).toBe(31.99);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    const items = [{ price: 3, quantity: 9 }];

    expect(bulkDiscount(items)).toBe(0);
    expect(cartTotal(items)).toBe(31.99);
  });

  it('gives 10% off a cart of 11 items', () => {
    const items = [
      { price: 2, quantity: 5 },
      { price: 2, quantity: 6 },
    ];

    expect(bulkDiscount(items)).toBe(2.2);
    expect(cartTotal(items)).toBe(24.79);
  });
});

describe('coupons', () => {
  it('takes SAVE5 off after the bulk discount', () => {
    // 60 - 6 (bulk) = 54, - 5 = 49, + 4.99 shipping. Coupon first would give 54.49.
    expect(cartTotal([{ price: 5, quantity: 12 }], { coupon: 'SAVE5' })).toBe(53.99);
  });

  it('never lets SAVE5 bring the goods below $0', () => {
    // Goods floored at 0; a non-empty cart under $50 still pays shipping.
    expect(cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' })).toBe(4.99);
  });

  it('refuses an unknown coupon code with an error', () => {
    expect(() => cartTotal([{ price: 10, quantity: 1 }], { coupon: 'SAVE10' })).toThrow(/\bSAVE10$/);
  });

  it('refuses the coupon code in a different case', () => {
    expect(() => cartTotal([{ price: 10, quantity: 1 }], { coupon: 'save5' })).toThrow(/\bsave5$/);
  });
});

describe('shipping', () => {
  it('ships free when the goods cost exactly $50 and charges $4.99 at $49.99', () => {
    expect(cartTotal([{ price: 50, quantity: 1 }])).toBe(50);
    expect(cartTotal([{ price: 49.99, quantity: 1 }])).toBe(54.98);
  });

  it('decides free shipping on the goods after discounts, not the subtotal', () => {
    // Subtotal 55, after the bulk discount 49.5, so shipping is charged.
    expect(cartTotal([{ price: 5, quantity: 11 }])).toBe(54.49);
  });

  it('charges nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });

  it('charges nothing for an empty cart with SAVE5', () => {
    expect(cartTotal([], { coupon: 'SAVE5' })).toBe(0);
  });
});
