// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10
import { describe, expect, it } from 'vitest';
import { bulkDiscount, cartTotal } from '../src/cart.js';

// cartTotal rounds to whole cents, so totals are compared exactly.

describe('bulk discount', () => {
  // Expected to fail: suspected defect. bulkDiscount in src/cart.js checks `itemCount > BULK_THRESHOLD`,
  // so exactly 10 items get no discount although CART-12 AC1 says 10 or more do. Drop `.fails` once fixed.
  it.fails('gives 10% off a cart of exactly 10 items spread over several lines', () => {
    const items = [
      { price: 6, quantity: 4 },
      { price: 6, quantity: 6 },
    ];

    // $60 less 10% is $54, which ships free.
    expect(cartTotal(items)).toBe(54);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    expect(cartTotal([{ price: 10, quantity: 9 }])).toBe(90);
  });

  it('counts quantities across lines towards the bulk discount', () => {
    // Neither line reaches 10 items alone; together they hold 12.
    const items = [
      { price: 5, quantity: 6 },
      { price: 5, quantity: 6 },
    ];

    expect(bulkDiscount(items)).toBe(6);
    expect(cartTotal(items)).toBe(54);
  });
});

describe('coupons', () => {
  it('takes SAVE5 off after the bulk discount', () => {
    // $60 -> $54 after the bulk discount -> $49 after SAVE5, under $50 so $4.99 shipping.
    // Applying SAVE5 first would give $49.50 + $4.99 = $54.49.
    expect(cartTotal([{ price: 5, quantity: 12 }], { coupon: 'SAVE5' })).toBe(53.99);
  });

  it('never prices the goods below $0 with SAVE5', () => {
    // $3 of goods less $5 floors at $0; the non-empty cart still pays $4.99 shipping.
    expect(cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' })).toBe(4.99);
  });

  describe('refuses any coupon code other than SAVE5', () => {
    // Another code, SAVE5 in another case, and an empty code.
    it.each(['SAVE10', 'save5', ''])('refuses %j', (coupon) => {
      expect(() => cartTotal([{ price: 10, quantity: 1 }], { coupon })).toThrow(
        new Error(`Unknown coupon: ${coupon}`),
      );
    });
  });
});

describe('shipping', () => {
  it('ships free when the goods cost exactly $50', () => {
    expect(cartTotal([{ price: 50, quantity: 1 }])).toBe(50);
  });

  it('charges $4.99 shipping when the goods cost $49.99', () => {
    expect(cartTotal([{ price: 49.99, quantity: 1 }])).toBe(54.98);
  });

  it('judges free shipping on the price after the bulk discount', () => {
    // $54 subtotal -> $48.60 after the bulk discount, under $50 so $4.99 shipping.
    expect(cartTotal([{ price: 4.5, quantity: 12 }])).toBe(53.59);
  });

  it('charges nothing for an empty cart, even with SAVE5', () => {
    expect(cartTotal([])).toBe(0);
    expect(cartTotal([], { coupon: 'SAVE5' })).toBe(0);
  });
});
