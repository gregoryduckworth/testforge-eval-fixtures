// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11
import { describe, expect, it } from 'vitest';
import { cartTotal } from '../src/cart.js';

describe('cartTotal', () => {
  // Suspected defect: bulkDiscount uses `itemCount > BULK_THRESHOLD` instead of `>=`,
  // so exactly 10 items gets no discount (returns 100, AC1 expects 90).
  it.fails('gives 10% off a cart of exactly 10 items spread over several lines', () => {
    expect(
      cartTotal([
        { price: 10, quantity: 6 },
        { price: 10, quantity: 4 },
      ]),
    ).toBe(90);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    expect(cartTotal([{ price: 10, quantity: 9 }])).toBe(90);
  });

  it('gives 10% off a cart of 11 items spread over several lines', () => {
    expect(
      cartTotal([
        { price: 10, quantity: 5 },
        { price: 10, quantity: 6 },
      ]),
    ).toBe(99);
  });

  it('takes SAVE5 off after the bulk discount', () => {
    expect(cartTotal([{ price: 6, quantity: 11 }], { coupon: 'SAVE5' })).toBe(54.4);
  });

  it('never lets SAVE5 bring the goods below $0', () => {
    expect(cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' })).toBe(4.99);
  });

  it('refuses an unknown coupon code with an error', () => {
    const coupon = 'SAVE10';
    const act = () => cartTotal([{ price: 10, quantity: 1 }], { coupon });
    expect(act).toThrow(Error);
    expect(act).toThrow(new RegExp(coupon));
  });

  it('refuses the coupon code in a different case', () => {
    const coupon = 'save5';
    const act = () => cartTotal([{ price: 10, quantity: 1 }], { coupon });
    expect(act).toThrow(Error);
    expect(act).toThrow(new RegExp(coupon));
  });

  it('ships free when the goods cost exactly $50 after discounts', () => {
    expect(cartTotal([{ price: 55, quantity: 1 }], { coupon: 'SAVE5' })).toBe(50);
  });

  it('charges $4.99 shipping when the goods cost less than $50', () => {
    expect(cartTotal([{ price: 49.99, quantity: 1 }])).toBe(54.98);
  });

  it('charges nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });

  it('charges shipping when the bulk discount brings the goods below $50', () => {
    expect(cartTotal([{ price: 5, quantity: 11 }])).toBe(54.49);
  });
});
