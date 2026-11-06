// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10
import { describe, expect, it } from 'vitest';
import { cartTotal } from '../src/cart.js';

describe('cartTotal', () => {
  // Suspected defect: bulkDiscount uses `itemCount > BULK_THRESHOLD`, so exactly 10 items get no
  // discount. AC1 says "10 or more" and the constant's doc says "at least this many".
  it.fails('gives 10% off a cart of exactly 10 items spread across lines', () => {
    const items = [
      { price: 10, quantity: 4 },
      { price: 10, quantity: 6 },
    ];

    expect(cartTotal(items)).toBe(90);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    expect(cartTotal([{ price: 10, quantity: 9 }])).toBe(90);
  });

  it('gives 10% off a cart of 11 items', () => {
    const items = [
      { price: 10, quantity: 5 },
      { price: 10, quantity: 6 },
    ];

    expect(cartTotal(items)).toBe(99);
  });

  it('takes SAVE5 off after the bulk discount', () => {
    expect(cartTotal([{ price: 10, quantity: 11 }], { coupon: 'SAVE5' })).toBe(94);
  });

  it('never prices the goods below $0 with SAVE5', () => {
    expect(cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' })).toBe(4.99);
  });

  it('refuses an unknown coupon code with an error', () => {
    expect(() => cartTotal([{ price: 10, quantity: 1 }], { coupon: 'SAVE10' })).toThrow('SAVE10');
  });

  it('ships free when the discounted goods cost exactly $50', () => {
    expect(cartTotal([{ price: 55, quantity: 1 }], { coupon: 'SAVE5' })).toBe(50);
  });

  it('charges $4.99 shipping when the goods cost $49.99', () => {
    expect(cartTotal([{ price: 49.99, quantity: 1 }])).toBe(54.98);
  });

  it('charges shipping when only the undiscounted subtotal reaches $50', () => {
    expect(cartTotal([{ price: 5, quantity: 11 }])).toBe(54.49);
  });

  it('charges nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });
});
