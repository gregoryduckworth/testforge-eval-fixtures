// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10
import { describe, expect, it } from 'vitest';
import { SHIPPING, cartTotal } from '../src/cart.js';

describe('cartTotal bulk discount', () => {
  it('gives 10% off a cart of more than 10 items', () => {
    expect(cartTotal([{ price: 10, quantity: 11 }])).toBe(99);
  });

  // Defect: the code compares with `>` so exactly 10 items get no discount (total 100, not 90).
  it.fails('gives 10% off a cart of exactly 10 items across lines', () => {
    expect(
      cartTotal([
        { price: 10, quantity: 4 },
        { price: 10, quantity: 6 },
      ]),
    ).toBe(90);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    expect(cartTotal([{ price: 10, quantity: 9 }])).toBe(90);
  });
});

describe('cartTotal coupons', () => {
  it('takes SAVE5 off after the bulk discount', () => {
    expect(cartTotal([{ price: 10, quantity: 11 }], { coupon: 'SAVE5' })).toBe(94);
  });

  it('never prices the goods below $0 with SAVE5', () => {
    expect(cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' })).toBe(SHIPPING);
  });

  it('refuses an unknown coupon code with an error', () => {
    expect(() => cartTotal([{ price: 10, quantity: 1 }], { coupon: 'BOGUS10' })).toThrow('BOGUS10');
  });

  it('refuses SAVE5 written in the wrong case', () => {
    expect(() => cartTotal([{ price: 10, quantity: 1 }], { coupon: 'save5' })).toThrow('save5');
  });

  // Defect: the coupon lookup uses `in`, so inherited keys like 'toString' are accepted.
  it.fails('refuses a coupon code that matches an object prototype key', () => {
    expect(() => cartTotal([{ price: 10, quantity: 1 }], { coupon: 'toString' })).toThrow(
      'toString',
    );
  });
});

describe('cartTotal shipping', () => {
  it('ships free when the goods cost exactly $50 after the coupon', () => {
    expect(cartTotal([{ price: 55, quantity: 1 }], { coupon: 'SAVE5' })).toBe(50);
  });

  it('charges $4.99 shipping when discounts bring the goods below $50', () => {
    expect(cartTotal([{ price: 54, quantity: 1 }], { coupon: 'SAVE5' })).toBe(53.99);
  });

  it('charges nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });
});
