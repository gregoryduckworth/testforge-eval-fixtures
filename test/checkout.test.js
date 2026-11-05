// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10
import { describe, expect, it } from 'vitest';
import { cartTotal } from '../src/cart.js';

const line = (price, quantity) => ({ price, quantity });

describe('bulk discount', () => {
  // Defect: the code compares with `>` so exactly 10 items get no discount (AC1 says 10 or more).
  it.fails('gives 10% off a cart with exactly 10 items across lines', () => {
    expect(cartTotal([line(10, 4), line(10, 6)])).toBe(90);
  });

  it('gives no bulk discount to a cart with 9 items', () => {
    expect(cartTotal([line(10, 9)])).toBe(90);
  });

  it('gives 10% off a cart with 11 items', () => {
    expect(cartTotal([line(10, 11)])).toBe(99);
  });
});

describe('coupons', () => {
  it('takes SAVE5 off after the bulk discount', () => {
    expect(cartTotal([line(5, 11)], { coupon: 'SAVE5' })).toBe(49.49);
  });

  it('never lets SAVE5 take the goods below $0', () => {
    expect(cartTotal([line(3, 1)], { coupon: 'SAVE5' })).toBe(4.99);
  });

  it('refuses an unknown coupon code with an error', () => {
    for (const coupon of ['SAVE10', 'save5']) {
      expect(() => cartTotal([line(10, 1)], { coupon })).toThrow(coupon);
    }
  });

  // Defect: the coupon lookup uses `in`, so inherited property names are accepted as coupons.
  it.fails('refuses a coupon code named like an object property', () => {
    expect(() => cartTotal([line(10, 1)], { coupon: 'toString' })).toThrow('toString');
  });
});

describe('shipping', () => {
  it('ships free when discounted goods are exactly $50', () => {
    expect(cartTotal([line(55, 1)], { coupon: 'SAVE5' })).toBe(50);
  });

  it('charges $4.99 shipping when discounted goods fall below $50', () => {
    expect(cartTotal([line(54.99, 1)], { coupon: 'SAVE5' })).toBe(54.98);
  });

  it('charges nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });
});
