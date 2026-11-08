// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11, TC12
import { describe, expect, it } from 'vitest';
import { cartTotal } from '../src/cart.js';

describe('cartTotal', () => {
  // Suspected defect: bulkDiscount uses `itemCount > BULK_THRESHOLD`, so exactly 10 items get no
  // discount (100 is returned), contradicting AC1 ("10 or more") and the constant's doc comment.
  it.fails('gives 10% off a cart of exactly 10 items', () => {
    expect(cartTotal([{ price: 10, quantity: 10 }])).toBeCloseTo(90, 2);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    expect(cartTotal([{ price: 3, quantity: 9 }])).toBe(31.99);
  });

  it("counts items by adding up each line's quantity for the bulk discount", () => {
    expect(
      cartTotal([
        { price: 10, quantity: 6 },
        { price: 10, quantity: 5 },
      ]),
    ).toBeCloseTo(99, 2);
  });

  it('takes SAVE5 off after the bulk discount', () => {
    expect(cartTotal([{ price: 5, quantity: 11 }], { coupon: 'SAVE5' })).toBeCloseTo(49.49, 2);
  });

  it('never lets SAVE5 take the goods below $0', () => {
    expect(cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' })).toBe(4.99);
  });

  it('lets SAVE5 take goods of exactly $5 to $0', () => {
    expect(cartTotal([{ price: 5, quantity: 1 }], { coupon: 'SAVE5' })).toBe(4.99);
  });

  it('refuses an unknown coupon code with an error', () => {
    const act = () => cartTotal([{ price: 10, quantity: 1 }], { coupon: 'SAVE10' });
    expect(act).toThrow(Error);
    expect(act).toThrow('SAVE10');
  });

  it('refuses a coupon code that differs from SAVE5 only in case', () => {
    const act = () => cartTotal([{ price: 10, quantity: 1 }], { coupon: 'save5' });
    expect(act).toThrow(Error);
    expect(act).toThrow('save5');
  });

  it('ships free when the goods cost exactly $50', () => {
    expect(cartTotal([{ price: 50, quantity: 1 }])).toBe(50);
  });

  it('charges $4.99 shipping when the goods cost $49.99', () => {
    expect(cartTotal([{ price: 49.99, quantity: 1 }])).toBe(54.98);
  });

  it('judges free shipping on the goods after the bulk discount', () => {
    expect(cartTotal([{ price: 5, quantity: 11 }])).toBeCloseTo(54.49, 2);
  });

  it('charges nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });
});
