// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9
import { describe, expect, it } from 'vitest';
import { cartTotal, subtotal } from '../src/cart.js';

describe('subtotal', () => {
  it('adds up each line by its quantity', () => {
    expect(
      subtotal([
        { price: 2.5, quantity: 2 },
        { price: 1.25, quantity: 4 },
      ]),
    ).toBe(10);
  });

  it('is zero for an empty cart', () => {
    expect(subtotal([])).toBe(0);
  });
});

describe('cartTotal', () => {
  describe('bulk discount', () => {
    // Expected to fail: suspected defect. bulkDiscount in src/cart.js checks
    // `itemCount > BULK_THRESHOLD`, so exactly 10 items gets no discount (CART-12 AC1 says 10 or more).
    it.fails('gives 10% off a cart of exactly 10 items spread over several lines', () => {
      const items = [
        { price: 10, quantity: 4 },
        { price: 10, quantity: 6 },
      ];

      // $100 less 10% = $90, which also ships free.
      expect(cartTotal(items)).toBe(90);
    });

    it('gives no bulk discount to a cart of 9 items', () => {
      // $45 undiscounted, plus $4.99 shipping.
      expect(cartTotal([{ price: 5, quantity: 9 }])).toBe(49.99);
    });

    it('gives 10% off a cart of 12 items', () => {
      // $60 less 10% = $54, which ships free.
      expect(cartTotal([{ price: 5, quantity: 12 }])).toBe(54);
    });
  });

  describe('coupons', () => {
    it('takes SAVE5 off after the bulk discount', () => {
      // $55 - $5.50 bulk - $5 coupon = $44.50, plus $4.99 shipping.
      // Applying the coupon first would give ($55 - $5) * 0.9 + $4.99 = $49.99.
      expect(cartTotal([{ price: 5, quantity: 11 }], { coupon: 'SAVE5' })).toBe(49.49);
    });

    it('never lets SAVE5 take the goods below $0', () => {
      // $3 - $5 floors at $0; the goods are under $50 so shipping is charged.
      expect(cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' })).toBe(4.99);
    });

    it('refuses any coupon code other than SAVE5', () => {
      const items = [{ price: 20, quantity: 1 }];

      expect(() => cartTotal(items, { coupon: 'SAVE10' })).toThrow('Unknown coupon: SAVE10');
      expect(() => cartTotal(items, { coupon: 'save5' })).toThrow('Unknown coupon: save5');
    });
  });

  describe('shipping', () => {
    it('ships free when the goods cost exactly $50 after discounts', () => {
      // $55 - $5 coupon = $50.
      expect(cartTotal([{ price: 55, quantity: 1 }], { coupon: 'SAVE5' })).toBe(50);
    });

    it('charges $4.99 shipping when the goods cost just under $50', () => {
      expect(cartTotal([{ price: 49.99, quantity: 1 }])).toBe(54.98);
    });

    it('charges nothing for an empty cart', () => {
      expect(cartTotal([])).toBe(0);
    });
  });
});
