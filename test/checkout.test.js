// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10
import { describe, expect, it } from 'vitest';
import { cartTotal } from '../src/cart.js';

describe('cartTotal bulk discount', () => {
  // Suspected defect: bulkDiscount uses `itemCount > BULK_THRESHOLD`, so exactly 10 items get no
  // discount, though the ticket and BULK_THRESHOLD's doc comment say "at least" 10.
  it.fails('gives 10% off a cart of exactly 10 items', () => {
    const items = [
      { price: 10, quantity: 4 },
      { price: 10, quantity: 6 },
    ];

    expect(cartTotal(items)).toBe(90);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    expect(cartTotal([{ price: 10, quantity: 9 }])).toBe(90);
  });

  it("counts items by adding up each line's quantity", () => {
    const items = [
      { price: 5, quantity: 7 },
      { price: 5, quantity: 5 },
    ];

    expect(cartTotal(items)).toBe(54);
  });
});

describe('cartTotal coupons', () => {
  it('takes SAVE5 off after the bulk discount', () => {
    // 120 - 12 (bulk) - 5 = 103; applying the coupon first would give 103.5
    expect(cartTotal([{ price: 10, quantity: 12 }], { coupon: 'SAVE5' })).toBe(103);
  });

  it('never prices goods below $0 with SAVE5', () => {
    // goods floor at 0, then $4.99 shipping
    expect(cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' })).toBe(4.99);
  });

  it('refuses an unknown coupon code with an error', () => {
    expect(() => cartTotal([{ price: 10, quantity: 1 }], { coupon: 'SAVE10' })).toThrow(/\bSAVE10\b/);
  });
});

describe('cartTotal shipping', () => {
  it('ships free when goods cost exactly $50 after discounts', () => {
    expect(cartTotal([{ price: 55, quantity: 1 }], { coupon: 'SAVE5' })).toBe(50);
  });

  it('charges $4.99 shipping when goods cost $49.99', () => {
    expect(cartTotal([{ price: 49.99, quantity: 1 }])).toBe(54.98);
  });

  it('charges shipping when the bulk discount takes goods below $50', () => {
    // 55 - 5.50 (bulk) = 49.50, plus 4.99 shipping
    expect(cartTotal([{ price: 5, quantity: 11 }])).toBe(54.49);
  });

  it('costs nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });
});
