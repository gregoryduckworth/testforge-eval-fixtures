// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10
import { describe, expect, it } from 'vitest';
import { BULK_THRESHOLD, cartTotal } from '../src/cart.js';

describe('bulk discount', () => {
  // AC1 says "10 or more"; the code uses `>` so exactly 10 gets no discount: a defect.
  it.fails('gives 10% off a cart with exactly 10 items across lines', () => {
    expect(
      cartTotal([
        { price: 3, quantity: 4 },
        { price: 2, quantity: 6 },
      ]),
    ).toBe(26.59);
  });

  it('sets the bulk threshold at 10 items', () => {
    expect(BULK_THRESHOLD).toBe(10);
  });

  it('gives no bulk discount to a cart with 9 items', () => {
    expect(
      cartTotal([
        { price: 3, quantity: 4 },
        { price: 2, quantity: 5 },
      ]),
    ).toBe(26.99);
  });

  it('gives 10% off a cart with 11 items', () => {
    expect(
      cartTotal([
        { price: 3, quantity: 5 },
        { price: 2, quantity: 6 },
      ]),
    ).toBe(29.29);
  });
});

describe('coupons', () => {
  it('takes SAVE5 off after the bulk discount', () => {
    expect(cartTotal([{ price: 6, quantity: 11 }], { coupon: 'SAVE5' })).toBe(54.4);
  });

  it('never lets SAVE5 take the goods below $0', () => {
    expect(cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' })).toBe(4.99);
  });

  it('refuses an unknown coupon code with an error', () => {
    expect(() => cartTotal([{ price: 10, quantity: 1 }], { coupon: 'SAVE10' })).toThrow(/SAVE10/);
  });

  it('refuses a lower-case save5 coupon', () => {
    expect(() => cartTotal([{ price: 10, quantity: 1 }], { coupon: 'save5' })).toThrow(/save5/);
  });
});

describe('shipping', () => {
  it('ships free when goods reach exactly $50 after discounts', () => {
    expect(cartTotal([{ price: 55, quantity: 1 }], { coupon: 'SAVE5' })).toBe(50);
  });

  it('charges $4.99 shipping when discounts take the goods below $50', () => {
    expect(cartTotal([{ price: 54.99, quantity: 1 }], { coupon: 'SAVE5' })).toBe(54.98);
  });

  it('charges nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });
});
