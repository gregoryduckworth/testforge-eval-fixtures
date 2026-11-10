// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10
import { describe, expect, it } from 'vitest';
import { cartTotal } from '../src/cart.js';

describe('cartTotal bulk discount', () => {
  // Suspected defect: bulkDiscount compares itemCount > BULK_THRESHOLD, so a cart of exactly
  // 10 items gets no discount although the criterion (and the constant's doc) says 10 or more.
  it.fails('gives 10% off a cart of exactly 10 items spread over several lines', () => {
    const items = [
      { price: 2, quantity: 6 },
      { price: 2, quantity: 4 },
    ];

    // $20 subtotal - $2 bulk discount + $4.99 shipping
    expect(cartTotal(items)).toBe(22.99);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    const items = [{ price: 2, quantity: 9 }];

    // $18 subtotal + $4.99 shipping
    expect(cartTotal(items)).toBe(22.99);
  });

  it('gives 10% off a cart of more than 10 items', () => {
    const items = [{ price: 5, quantity: 12 }];

    // $60 subtotal - $6 bulk discount, free shipping
    expect(cartTotal(items)).toBe(54);
  });
});

describe('cartTotal coupons', () => {
  it('takes SAVE5 off after the bulk discount', () => {
    const items = [{ price: 5, quantity: 12 }];

    // ($60 - $6) - $5 = $49, under $50 so $4.99 shipping; coupon first would give $54.49
    expect(cartTotal(items, { coupon: 'SAVE5' })).toBe(53.99);
  });

  it('never lets SAVE5 take the goods below $0', () => {
    const items = [{ price: 3, quantity: 1 }];

    // goods floored at $0, plus $4.99 shipping
    expect(cartTotal(items, { coupon: 'SAVE5' })).toBe(4.99);
  });

  it('refuses an unknown coupon code with an error', () => {
    const items = [{ price: 5, quantity: 1 }];

    expect(() => cartTotal(items, { coupon: 'SAVE10' })).toThrow(/\bSAVE10$/);
  });
});

describe('cartTotal shipping', () => {
  it('ships free when the goods cost exactly $50', () => {
    const items = [{ price: 25, quantity: 2 }];

    expect(cartTotal(items)).toBe(50);
  });

  it('charges $4.99 shipping when the goods cost $49.99', () => {
    const items = [{ price: 49.99, quantity: 1 }];

    expect(cartTotal(items)).toBe(54.98);
  });

  it('decides free shipping on the goods after discounts', () => {
    const items = [{ price: 4.5, quantity: 12 }];

    // $54 subtotal - $5.40 bulk discount = $48.60, under $50 so $4.99 shipping
    expect(cartTotal(items)).toBe(53.59);
  });

  it('charges nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });

  it('charges nothing for an empty cart, even with SAVE5', () => {
    expect(cartTotal([], { coupon: 'SAVE5' })).toBe(0);
  });
});
