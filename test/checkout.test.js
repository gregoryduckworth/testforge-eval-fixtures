// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11, TC12
import { describe, expect, it } from 'vitest';
import { FREE_SHIPPING_FROM, cartTotal } from '../src/cart.js';

describe('cartTotal', () => {
  it('gives 10% off a cart whose line quantities add up to more than 10', () => {
    expect(
      cartTotal([
        { price: 10, quantity: 6 },
        { price: 10, quantity: 5 },
      ]),
    ).toBe(99);
  });

  // Known defect: bulkDiscount uses `itemCount > BULK_THRESHOLD`, so exactly 10 items get no
  // discount (returns 100). AC1 says "10 or more" and the doc comment says "at least".
  it.fails('gives 10% off a cart of exactly 10 items', () => {
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

  it('takes $5 off with SAVE5 after the bulk discount', () => {
    expect(cartTotal([{ price: 10, quantity: 12 }], { coupon: 'SAVE5' })).toBe(103);
  });

  it('never lets SAVE5 take the goods below $0', () => {
    expect(cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' })).toBe(4.99);
  });

  it('refuses an unknown coupon code with an error', () => {
    expect(() => cartTotal([{ price: 10, quantity: 1 }], { coupon: 'SAVE10' })).toThrow('SAVE10');
  });

  it('refuses a coupon code that differs from SAVE5 only in case', () => {
    expect(() => cartTotal([{ price: 10, quantity: 1 }], { coupon: 'save5' })).toThrow('save5');
  });

  it('ships free when the goods cost exactly $50', () => {
    expect(cartTotal([{ price: FREE_SHIPPING_FROM, quantity: 1 }])).toBe(50);
  });

  it('charges $4.99 shipping when the goods cost $49.99', () => {
    expect(cartTotal([{ price: 49.99, quantity: 1 }])).toBe(54.98);
  });

  it('judges free shipping on the goods after discounts', () => {
    expect(cartTotal([{ price: 54, quantity: 1 }], { coupon: 'SAVE5' })).toBe(53.99);
  });

  it('charges nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });

  it('charges nothing for an empty cart with SAVE5', () => {
    expect(cartTotal([], { coupon: 'SAVE5' })).toBe(0);
  });
});
