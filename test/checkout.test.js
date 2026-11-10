// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10
import { describe, expect, it } from 'vitest';
import { cartTotal } from '../src/cart.js';

describe('cartTotal: bulk discount', () => {
  // Suspected defect: bulkDiscount checks `itemCount(items) > BULK_THRESHOLD`, so a cart of
  // exactly 10 items gets no discount, although the criterion (and BULK_THRESHOLD's doc comment)
  // say "10 or more". Remove `.fails` once the comparison is `>=`.
  it.fails('gives 10% off a cart of exactly 10 items spread across lines', () => {
    const items = [
      { price: 10, quantity: 4 },
      { price: 10, quantity: 6 },
    ];

    expect(cartTotal(items)).toBe(90);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    expect(cartTotal([{ price: 10, quantity: 9 }])).toBe(90);
  });

  it('gives 10% off a cart of 11 items', () => {
    expect(cartTotal([{ price: 10, quantity: 11 }])).toBe(99);
  });
});

describe('cartTotal: coupons', () => {
  it('takes SAVE5 off after the bulk discount', () => {
    // 110 - 11 (10%) - 5 = 94; taking the coupon off first would give 94.5
    expect(cartTotal([{ price: 10, quantity: 11 }], { coupon: 'SAVE5' })).toBe(94);
  });

  it('never prices the goods below $0 with SAVE5', () => {
    // goods: max(0, 3 - 5) = 0, plus shipping on a non-empty cart
    expect(cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' })).toBe(4.99);
  });

  it('refuses an unknown coupon code with an error', () => {
    const items = [{ price: 10, quantity: 1 }];

    // The message ends with the code the test submitted; codes are matched case-sensitively.
    expect(() => cartTotal(items, { coupon: 'SAVE10' })).toThrow(/: SAVE10$/);
    expect(() => cartTotal(items, { coupon: 'save5' })).toThrow(/: save5$/);
  });
});

describe('cartTotal: shipping', () => {
  it('ships free when the goods reach exactly $50 after the coupon', () => {
    expect(cartTotal([{ price: 55, quantity: 1 }], { coupon: 'SAVE5' })).toBe(50);
  });

  it('charges $4.99 shipping when the bulk discount takes the goods below $50', () => {
    // 55 - 5.5 = 49.5, plus 4.99 shipping
    expect(cartTotal([{ price: 5, quantity: 11 }])).toBe(54.49);
  });

  it('charges $4.99 shipping on goods of $49.99', () => {
    expect(cartTotal([{ price: 49.99, quantity: 1 }])).toBe(54.98);
  });

  it('prices an empty cart at $0', () => {
    expect(cartTotal([])).toBe(0);
  });
});
