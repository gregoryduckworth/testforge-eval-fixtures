// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10
import { describe, expect, it } from 'vitest';
import { BULK_THRESHOLD, FREE_SHIPPING_FROM, SHIPPING, cartTotal } from '../src/cart.js';

describe('cartTotal bulk discount', () => {
  // Expected to fail: suspected defect. bulkDiscount in src/cart.js uses `> BULK_THRESHOLD`, so a
  // cart of exactly 10 items gets no discount (AC1 says 10 or more). Remove `.fails` once fixed.
  it.fails('gives 10% off a cart of exactly 10 items', () => {
    // 10 × $6 = $60, less 10% = $54, which ships free.
    expect(cartTotal([{ price: 6, quantity: BULK_THRESHOLD }])).toBe(54);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    // 9 × $6 = $54, no discount, ships free.
    expect(cartTotal([{ price: 6, quantity: BULK_THRESHOLD - 1 }])).toBe(54);
  });

  it("counts the bulk threshold by adding up each line's quantity", () => {
    // Two lines of 5 and 6 items: subtotal $67, 11 items, less $6.70 = $60.30, ships free.
    expect(
      cartTotal([
        { price: 5, quantity: 5 },
        { price: 7, quantity: 6 },
      ]),
    ).toBe(60.3);
  });
});

describe('cartTotal coupons', () => {
  it('takes SAVE5 off after the bulk discount', () => {
    // $60 − $6 bulk − $5 coupon = $49 goods + shipping. Coupon first would give $54.49.
    expect(cartTotal([{ price: 5, quantity: 12 }], { coupon: 'SAVE5' })).toBe(53.99);
  });

  it('never lets SAVE5 make the goods cost less than $0', () => {
    // $3 − $5 floors at $0 goods; the cart isn't empty, so shipping still applies.
    expect(cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' })).toBe(SHIPPING);
  });

  it.each([{ coupon: 'SAVE10' }, { coupon: 'save5' }, { coupon: '' }])(
    'refuses any coupon code other than SAVE5 ("$coupon")',
    ({ coupon }) => {
      expect(() => cartTotal([{ price: 10, quantity: 1 }], { coupon })).toThrow(
        new Error(`Unknown coupon: ${coupon}`),
      );
    },
  );
});

describe('cartTotal shipping', () => {
  it('ships free when the goods cost exactly $50', () => {
    expect(cartTotal([{ price: FREE_SHIPPING_FROM, quantity: 1 }])).toBe(50);
  });

  it('charges $4.99 shipping when the goods cost under $50', () => {
    expect(cartTotal([{ price: 49.99, quantity: 1 }])).toBe(54.98);
  });

  it('charges shipping when discounts bring the goods under $50', () => {
    // 11 × $5 = $55, less 10% = $49.50, + $4.99 shipping.
    expect(cartTotal([{ price: 5, quantity: 11 }])).toBe(54.49);
  });

  it('charges nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });
});
