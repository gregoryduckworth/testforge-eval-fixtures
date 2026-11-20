// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10
import { describe, expect, it } from 'vitest';
import { cartTotal } from '../src/cart.js';

describe('cartTotal', () => {
  describe('bulk discount', () => {
    // Suspected defect: bulkDiscount in src/cart.js checks `itemCount > BULK_THRESHOLD`, so a cart of
    // exactly 10 items gets no discount although CART-12 gives 10% off at 10 or more items.
    it.fails('gives 10% off a cart of exactly 10 items spread over several lines', () => {
      const items = [
        { price: 10, quantity: 4 },
        { price: 10, quantity: 6 },
      ];

      const total = cartTotal(items);

      // $100 less 10% is $90, which ships free.
      expect(total).toBe(90);
    });

    it('gives 10% off a cart of 11 items spread over several lines', () => {
      const items = [
        { price: 10, quantity: 5 },
        { price: 10, quantity: 6 },
      ];

      const total = cartTotal(items);

      // $110 less 10% is $99, which ships free.
      expect(total).toBe(99);
    });

    it('gives no bulk discount to a cart of 9 items', () => {
      const items = [
        { price: 10, quantity: 4 },
        { price: 10, quantity: 5 },
      ];

      const total = cartTotal(items);

      expect(total).toBe(90);
    });
  });

  describe('coupons', () => {
    it('takes $5 off with SAVE5 after the bulk discount', () => {
      const items = [{ price: 10, quantity: 11 }];

      const total = cartTotal(items, { coupon: 'SAVE5' });

      // $110 less 10% ($11) less $5; applying the coupon first would give $94.50.
      expect(total).toBe(94);
    });

    it('never prices the goods below $0 with SAVE5', () => {
      const items = [{ price: 3, quantity: 1 }];

      const total = cartTotal(items, { coupon: 'SAVE5' });

      // Goods floor at $0, plus $4.99 shipping; without the floor it would be $2.99.
      expect(total).toBe(4.99);
    });

    it.each(['SAVE10', 'save5', ''])('refuses the coupon code %j with an error', (code) => {
      const items = [{ price: 10, quantity: 1 }];

      const act = () => cartTotal(items, { coupon: code });

      // An Error instance makes toThrow compare the whole message, which names the code tried.
      expect(act).toThrow(new Error(`Unknown coupon: ${code}`));
    });
  });

  describe('shipping', () => {
    it('ships free when the goods cost exactly $50', () => {
      const items = [{ price: 50, quantity: 1 }];

      const total = cartTotal(items);

      expect(total).toBe(50);
    });

    it('charges $4.99 shipping when discounts bring goods under $50', () => {
      const items = [{ price: 52, quantity: 1 }];

      const total = cartTotal(items, { coupon: 'SAVE5' });

      // The $52 subtotal reaches the threshold, but the discounted goods ($47) do not.
      expect(total).toBe(51.99);
    });

    it('charges $4.99 shipping on goods of $49.99', () => {
      const items = [{ price: 49.99, quantity: 1 }];

      const total = cartTotal(items);

      expect(total).toBe(54.98);
    });

    it('charges nothing for an empty cart', () => {
      const total = cartTotal([]);

      expect(total).toBe(0);
    });
  });
});
