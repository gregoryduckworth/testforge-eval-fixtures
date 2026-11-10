// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10
import { describe, expect, it } from 'vitest';
import { cartTotal } from '../src/cart.js';

describe('cartTotal bulk discount', () => {
  // Suspected defect: bulkDiscount compares itemCount > BULK_THRESHOLD, so a cart of exactly
  // 10 items gets no discount although the bulk discount applies from 10 items.
  it.fails('gives 10% off a cart of exactly 10 items spread over two lines', () => {
    const items = [
      { price: 10, quantity: 4 },
      { price: 10, quantity: 6 },
    ];

    expect(cartTotal(items)).toBe(90);
  });

  it('gives 10% off a cart of 11 items', () => {
    expect(cartTotal([{ price: 10, quantity: 11 }])).toBe(99);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    expect(cartTotal([{ price: 10, quantity: 9 }])).toBe(90);
  });
});

describe('cartTotal coupons', () => {
  it('takes SAVE5 off after the bulk discount', () => {
    // 60 -> 54 after 10% -> 49 after SAVE5, plus 4.99 shipping (coupon first would give 54.49)
    expect(cartTotal([{ price: 5, quantity: 12 }], { coupon: 'SAVE5' })).toBe(53.99);
  });

  it('never lets SAVE5 take the goods below $0', () => {
    // Goods floored at 0, plus 4.99 shipping
    expect(cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' })).toBe(4.99);
  });

  it('refuses an unknown coupon code with an error', () => {
    expect(() => cartTotal([{ price: 10, quantity: 1 }], { coupon: 'SAVE10' })).toThrow(/\bSAVE10$/);
  });
});

describe('cartTotal shipping', () => {
  it('ships free when discounted goods come to exactly $50', () => {
    expect(cartTotal([{ price: 55, quantity: 1 }], { coupon: 'SAVE5' })).toBe(50);
  });

  it('charges $4.99 shipping when goods come to $49.99', () => {
    expect(cartTotal([{ price: 49.99, quantity: 1 }])).toBe(54.98);
  });

  it('charges nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });

  it('charges shipping when the bulk discount takes goods below $50', () => {
    // 55 -> 49.50 after 10%, plus 4.99 shipping
    expect(cartTotal([{ price: 5, quantity: 11 }])).toBe(54.49);
  });
});
