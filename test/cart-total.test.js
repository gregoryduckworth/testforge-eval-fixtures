// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11
import { describe, expect, it } from 'vitest';
import { cartTotal } from '../src/cart.js';

describe('cartTotal', () => {
  // Known defect: bulkDiscount compares with `> BULK_THRESHOLD`, so exactly 10 items get no
  // discount, while the ticket gives 10% off from 10 items. The code returns 100 instead of 90.
  it.fails('gives 10% off a cart of exactly 10 items spread over several lines', () => {
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

  it('takes SAVE5 off after the bulk discount', () => {
    // 55 - 5.5 - 5 = 44.5 goods, plus 4.99 shipping (coupon-first would give 49.99).
    expect(cartTotal([{ price: 5, quantity: 11 }], { coupon: 'SAVE5' })).toBe(49.49);
  });

  it('never prices the goods below $0 with SAVE5', () => {
    expect(cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' })).toBe(4.99);
  });

  it('refuses an unknown coupon code with an error', () => {
    expect(() => cartTotal([{ price: 20, quantity: 1 }], { coupon: 'SAVE10' })).toThrow(/SAVE10/);
  });

  // Known defect: the coupon check uses `in`, which accepts inherited names such as 'toString'.
  // The ticket says unknown coupons are refused; the code returns NaN instead of throwing.
  it.fails('refuses a coupon code named like a built-in object property', () => {
    expect(() => cartTotal([{ price: 20, quantity: 1 }], { coupon: 'toString' })).toThrow(
      /toString/,
    );
  });

  it('ships free when the discounted goods cost exactly $50', () => {
    expect(cartTotal([{ price: 55, quantity: 1 }], { coupon: 'SAVE5' })).toBe(50);
  });

  it('charges $4.99 shipping when the goods cost $49.99', () => {
    expect(cartTotal([{ price: 49.99, quantity: 1 }])).toBe(54.98);
  });

  it('charges shipping when discounts bring a $54 subtotal under $50', () => {
    expect(cartTotal([{ price: 54, quantity: 1 }], { coupon: 'SAVE5' })).toBe(53.99);
  });

  it('prices an empty cart at $0', () => {
    expect(cartTotal([])).toBe(0);
  });
});
