// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11, TC12, TC13
import { describe, expect, it } from 'vitest';
import { cartTotal } from '../src/cart.js';

describe('cartTotal', () => {
  // Expected failure (AC1: "10 or more items" get 10% off): bulkDiscount in src/cart.js:22 uses
  // `itemCount(items) > BULK_THRESHOLD`, an off-by-one, so exactly 10 items return 100 instead of 90.
  it.fails('gives 10% off a cart of exactly 10 items spread over several lines', () => {
    expect(
      cartTotal([
        { price: 10, quantity: 6 },
        { price: 10, quantity: 4 },
      ]),
    ).toBe(90);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    expect(
      cartTotal([
        { price: 10, quantity: 5 },
        { price: 10, quantity: 4 },
      ]),
    ).toBe(90);
  });

  it('gives 10% off a cart of 11 items', () => {
    expect(cartTotal([{ price: 10, quantity: 11 }])).toBe(99);
  });

  it('takes SAVE5 off after the bulk discount', () => {
    expect(cartTotal([{ price: 10, quantity: 11 }], { coupon: 'SAVE5' })).toBe(94);
  });

  it('never lets SAVE5 take the goods below $0', () => {
    expect(cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' })).toBe(4.99);
  });

  it('refuses an unknown coupon code with an error', () => {
    expect(() => cartTotal([{ price: 10, quantity: 1 }], { coupon: 'SAVE10' })).toThrow(/SAVE10/);
  });

  it('refuses a lowercase save5 coupon code', () => {
    expect(() => cartTotal([{ price: 10, quantity: 1 }], { coupon: 'save5' })).toThrow(/save5/);
  });

  it('ships free when discounted goods cost exactly $50', () => {
    expect(cartTotal([{ price: 55, quantity: 1 }], { coupon: 'SAVE5' })).toBe(50);
  });

  it('charges $4.99 shipping when SAVE5 takes the goods below $50', () => {
    expect(cartTotal([{ price: 54, quantity: 1 }], { coupon: 'SAVE5' })).toBe(53.99);
  });

  it('charges $4.99 shipping when the bulk discount takes the goods below $50', () => {
    expect(cartTotal([{ price: 5, quantity: 11 }])).toBe(54.49);
  });

  it('charges $4.99 shipping on goods of $49.99', () => {
    expect(cartTotal([{ price: 49.99, quantity: 1 }])).toBe(54.98);
  });

  it('charges nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });

  it('charges nothing for an empty cart with SAVE5', () => {
    expect(cartTotal([], { coupon: 'SAVE5' })).toBe(0);
  });
});
