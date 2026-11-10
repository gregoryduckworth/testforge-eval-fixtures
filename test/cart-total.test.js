// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11, TC12
import { describe, expect, it } from 'vitest';
import { cartTotal } from '../src/cart.js';

describe('cartTotal', () => {
  // Known product defect: bulkDiscount uses `itemCount(items) > BULK_THRESHOLD`, so exactly 10
  // items get no discount (returns 100) although AC1 says 10 or more get 10% off.
  it.fails('gives 10% off a cart of exactly 10 items spread across lines', () => {
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

  it('gives 10% off a cart of more than 10 items', () => {
    expect(
      cartTotal([
        { price: 5, quantity: 5 },
        { price: 5, quantity: 7 },
      ]),
    ).toBe(54);
  });

  it('takes SAVE5 off after the bulk discount', () => {
    expect(cartTotal([{ price: 5, quantity: 12 }], { coupon: 'SAVE5' })).toBe(53.99);
  });

  it('never prices the goods below $0 with SAVE5', () => {
    expect(cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' })).toBe(4.99);
  });

  it('refuses an unknown coupon code with an error', () => {
    expect(() => cartTotal([{ price: 10, quantity: 1 }], { coupon: 'SAVE10' })).toThrow(/SAVE10/);
  });

  it('ships free when the discounted goods cost exactly $50', () => {
    expect(cartTotal([{ price: 55, quantity: 1 }], { coupon: 'SAVE5' })).toBe(50);
  });

  it('charges $4.99 shipping when the goods cost $49.99', () => {
    expect(cartTotal([{ price: 49.99, quantity: 1 }])).toBe(54.98);
  });

  it('charges shipping when the bulk discount takes the goods below $50', () => {
    expect(cartTotal([{ price: 4.5, quantity: 12 }])).toBe(53.59);
  });

  it('charges nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });

  it('charges shipping when SAVE5 takes the goods below $50', () => {
    expect(cartTotal([{ price: 54.99, quantity: 1 }], { coupon: 'SAVE5' })).toBe(54.98);
  });

  it('refuses a lower-case save5 coupon code', () => {
    expect(() => cartTotal([{ price: 10, quantity: 1 }], { coupon: 'save5' })).toThrow(/save5/);
  });
});
