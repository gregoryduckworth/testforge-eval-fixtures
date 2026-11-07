// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10
import { describe, expect, it } from 'vitest';
import { cartTotal } from '../src/cart.js';

describe('cartTotal', () => {
  // Known defect: bulkDiscount uses `> BULK_THRESHOLD`, so exactly 10 items
  // get no discount (returns 34.99) although AC1 says 10 or more.
  it.fails('gives 10% off a cart of exactly 10 items', () => {
    expect(cartTotal([{ price: 3, quantity: 10 }])).toBe(31.99);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    expect(cartTotal([{ price: 3, quantity: 9 }])).toBe(31.99);
  });

  it('counts items across lines by quantity for the bulk discount', () => {
    expect(
      cartTotal([
        { price: 2, quantity: 6 },
        { price: 2, quantity: 5 },
      ]),
    ).toBe(24.79);
  });

  it('takes SAVE5 off after the bulk discount', () => {
    expect(cartTotal([{ price: 5, quantity: 12 }], { coupon: 'SAVE5' })).toBe(53.99);
  });

  it('never lets SAVE5 take the goods below $0', () => {
    expect(cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' })).toBe(4.99);
  });

  it('refuses an unknown coupon code with an error', () => {
    expect(() => cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE10' })).toThrow('SAVE10');
  });

  it('refuses a coupon code that differs from SAVE5 only in case', () => {
    expect(() => cartTotal([{ price: 3, quantity: 1 }], { coupon: 'save5' })).toThrow('save5');
  });

  it('ships free when the goods reach exactly $50 after discounts', () => {
    expect(cartTotal([{ price: 55, quantity: 1 }], { coupon: 'SAVE5' })).toBe(50);
  });

  it('charges $4.99 shipping when the goods cost less than $50', () => {
    expect(cartTotal([{ price: 49.99, quantity: 1 }])).toBe(54.98);
  });

  it('charges nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });
});
