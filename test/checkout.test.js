// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10
import { describe, expect, it } from 'vitest';
import { cartTotal } from '../src/cart.js';

describe('cartTotal', () => {
  // Known defect: bulkDiscount uses `itemCount > BULK_THRESHOLD` instead of `>=`, so exactly
  // 10 items gets no discount (total 100 instead of 90). AC1 says 10 or more.
  it.fails('gives 10% off a cart of exactly 10 items', () => {
    expect(cartTotal([{ price: 10, quantity: 10 }])).toBe(90);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    expect(cartTotal([{ price: 10, quantity: 9 }])).toBe(90);
  });

  it("counts items by adding up each line's quantity", () => {
    const items = [
      { price: 20, quantity: 6 },
      { price: 5, quantity: 6 },
    ];
    expect(cartTotal(items)).toBe(135);
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

  it('ships free when discounted goods cost exactly $50', () => {
    expect(cartTotal([{ price: 55, quantity: 1 }], { coupon: 'SAVE5' })).toBe(50);
  });

  it('charges $4.99 shipping when discounts take the goods below $50', () => {
    expect(cartTotal([{ price: 27, quantity: 2 }], { coupon: 'SAVE5' })).toBe(53.99);
  });

  it('charges $4.99 shipping on goods just under $50', () => {
    expect(cartTotal([{ price: 49.99, quantity: 1 }])).toBe(54.98);
  });

  it('charges nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });
});
