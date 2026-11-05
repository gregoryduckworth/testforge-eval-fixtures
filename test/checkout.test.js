// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11, TC12
import { describe, expect, it } from 'vitest';
import { cartTotal } from '../src/cart.js';

describe('bulk discount', () => {
  // Expected to fail: bulkDiscount uses `> BULK_THRESHOLD`, so exactly 10 items get no discount.
  it.fails('gives 10% off a cart with exactly 10 items', () => {
    expect(cartTotal([{ price: 6, quantity: 10 }])).toBe(54);
  });

  it("counts items by adding up each line's quantity", () => {
    expect(
      cartTotal([
        { price: 10, quantity: 5 },
        { price: 10, quantity: 6 },
      ]),
    ).toBe(99);
  });

  it('gives no bulk discount to a cart with 9 items', () => {
    expect(cartTotal([{ price: 10, quantity: 9 }])).toBe(90);
  });
});

describe('coupons', () => {
  it('takes SAVE5 off after the bulk discount', () => {
    expect(cartTotal([{ price: 10, quantity: 11 }], { coupon: 'SAVE5' })).toBe(94);
  });

  it('never prices the goods below $0 with SAVE5', () => {
    expect(cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' })).toBe(4.99);
  });

  it('refuses an unknown coupon code with an error', () => {
    const items = [{ price: 10, quantity: 1 }];
    expect(() => cartTotal(items, { coupon: 'SAVE10' })).toThrow(/SAVE10/);
    expect(() => cartTotal(items, { coupon: 'save5' })).toThrow(/save5/);
  });

  // Expected to fail: `coupon in COUPONS` accepts inherited property names, so no error is thrown.
  it.fails('refuses a coupon code named like a built-in object property', () => {
    expect(() => cartTotal([{ price: 10, quantity: 1 }], { coupon: 'toString' })).toThrow(
      /toString/,
    );
  });
});

describe('shipping', () => {
  it('ships free when the goods cost exactly $50', () => {
    expect(cartTotal([{ price: 50, quantity: 1 }])).toBe(50);
  });

  it('charges $4.99 shipping when the goods cost under $50', () => {
    expect(cartTotal([{ price: 49.99, quantity: 1 }])).toBe(54.98);
  });

  it('charges shipping when the bulk discount takes the goods under $50', () => {
    expect(cartTotal([{ price: 5, quantity: 11 }])).toBe(54.49);
  });

  it('charges shipping when SAVE5 takes the goods under $50', () => {
    expect(cartTotal([{ price: 54, quantity: 1 }], { coupon: 'SAVE5' })).toBe(53.99);
  });

  it('charges nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });
});
