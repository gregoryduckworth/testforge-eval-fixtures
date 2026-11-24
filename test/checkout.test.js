// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10
import { describe, expect, it } from 'vitest';
import { bulkDiscount, cartTotal } from '../src/cart.js';

describe('bulk discount', () => {
  // Expected to fail: suspected defect. bulkDiscount compares `itemCount > BULK_THRESHOLD`, so a
  // cart of exactly 10 items gets no discount, while the ticket says "10 or more items".
  describe('gives 10% off a cart of exactly 10 items spread over several lines', () => {
    const tenItems = () => [
      { price: 10, quantity: 4 },
      { price: 10, quantity: 6 },
    ];

    it.fails('discounts $10 of the $100 subtotal', () => {
      expect(bulkDiscount(tenItems())).toBe(10);
    });

    it.fails('charges $90 with free shipping', () => {
      expect(cartTotal(tenItems())).toBe(90);
    });
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    const items = [
      { price: 10, quantity: 4 },
      { price: 10, quantity: 5 },
    ];

    expect(bulkDiscount(items)).toBe(0);
    expect(cartTotal(items)).toBe(90);
  });

  it('gives 10% off a cart of more than 10 items', () => {
    expect(cartTotal([{ price: 10, quantity: 12 }])).toBe(108);
  });
});

describe('coupons', () => {
  it('takes SAVE5 off after the bulk discount', () => {
    // 60 - 6 (bulk) - 5 (coupon) = 49 goods, under $50 so + 4.99 shipping.
    // Applying the coupon first would give (60 - 5) * 0.9 + 4.99 = 54.49.
    expect(cartTotal([{ price: 5, quantity: 12 }], { coupon: 'SAVE5' })).toBe(53.99);
  });

  it('never lets SAVE5 take the goods below $0', () => {
    // Goods floor at 0; the non-empty cart still pays 4.99 shipping.
    expect(cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' })).toBe(4.99);
  });

  it('refuses any coupon code other than SAVE5', () => {
    const items = [{ price: 20, quantity: 1 }];

    expect(() => cartTotal(items, { coupon: 'SAVE10' })).toThrow(new Error('Unknown coupon: SAVE10'));
    expect(() => cartTotal(items, { coupon: 'save5' })).toThrow(new Error('Unknown coupon: save5'));
  });
});

describe('shipping', () => {
  it('charges $4.99 shipping when the goods cost under $50 only after the bulk discount', () => {
    // Subtotal 54, bulk discount 5.40, goods 48.60 + 4.99 shipping.
    expect(cartTotal([{ price: 4.5, quantity: 12 }])).toBe(53.59);
  });

  it('ships free when the goods cost exactly $50', () => {
    expect(cartTotal([{ price: 50, quantity: 1 }])).toBe(50);
  });

  it('charges $4.99 shipping when the goods cost $49.99', () => {
    expect(cartTotal([{ price: 49.99, quantity: 1 }])).toBe(54.98);
  });

  it('charges nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });
});
