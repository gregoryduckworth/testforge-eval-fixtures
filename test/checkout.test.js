// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9
import { describe, expect, it } from 'vitest';
import { bulkDiscount, cartTotal } from '../src/cart.js';

describe('bulk discount', () => {
  // Suspected defect: bulkDiscount uses `itemCount > BULK_THRESHOLD`, so exactly 10 items get nothing,
  // while the ticket says "10 or more". The assertion stays; the test is expected to fail.
  it.fails('gives 10% off a cart of exactly 10 items spread over several lines', () => {
    const items = [
      { price: 10, quantity: 4 },
      { price: 10, quantity: 6 },
    ];
    expect(bulkDiscount(items)).toBe(10);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    const items = [
      { price: 10, quantity: 4 },
      { price: 10, quantity: 5 },
    ];
    expect(bulkDiscount(items)).toBe(0);
  });
});

describe('coupons', () => {
  it('takes SAVE5 off after the bulk discount', () => {
    expect(cartTotal([{ price: 5, quantity: 12 }], { coupon: 'SAVE5' })).toBe(53.99);
  });

  it('never prices the goods below $0 with SAVE5', () => {
    expect(cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' })).toBe(4.99);
  });

  it('refuses an unknown coupon code with an error', () => {
    expect(() => cartTotal([{ price: 20, quantity: 1 }], { coupon: 'SAVE10' })).toThrow(/SAVE10/);
  });
});

describe('shipping', () => {
  it('ships free when the goods reach exactly $50 after the coupon', () => {
    expect(cartTotal([{ price: 55, quantity: 1 }], { coupon: 'SAVE5' })).toBe(50);
  });

  it('charges $4.99 shipping when the goods cost $49.99', () => {
    expect(cartTotal([{ price: 49.99, quantity: 1 }])).toBe(54.98);
  });

  it('charges $4.99 shipping when the bulk discount takes the goods below $50', () => {
    expect(cartTotal([{ price: 5, quantity: 11 }])).toBe(54.49);
  });

  it('charges nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });
});
