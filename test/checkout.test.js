// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9
import { describe, expect, it } from 'vitest';
import { bulkDiscount, cartTotal } from '../src/cart.js';

describe('bulk discount', () => {
  // Expected to fail: suspected defect, bulkDiscount in src/cart.js uses `itemCount > BULK_THRESHOLD`,
  // so a cart of exactly 10 items gets no discount although 10 or more should.
  it.fails('gives 10% off a cart of exactly 10 items spread over two lines', () => {
    const items = [
      { price: 2, quantity: 4 },
      { price: 2, quantity: 6 },
    ];

    expect(bulkDiscount(items)).toBe(2);
  });

  // Expected to fail: same suspected defect as above, so cartTotal charges $24.99 instead of $22.99.
  it.fails('prices a cart of exactly 10 items with the 10% bulk discount', () => {
    // $20 less 10% = $18, plus $4.99 shipping.
    const items = [
      { price: 2, quantity: 4 },
      { price: 2, quantity: 6 },
    ];

    expect(cartTotal(items)).toBe(22.99);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    const items = [{ price: 2, quantity: 9 }];

    expect(bulkDiscount(items)).toBe(0);
  });

  it('prices a cart of 9 items at full price', () => {
    // $18 with no discount, plus $4.99 shipping.
    const items = [{ price: 2, quantity: 9 }];

    expect(cartTotal(items)).toBe(22.99);
  });
});

describe('coupons', () => {
  it('takes SAVE5 off after the bulk discount', () => {
    // $66 less 10% ($6.60) less $5 = $54.40, free shipping. Coupon first would give $54.90.
    const items = [{ price: 6, quantity: 11 }];

    expect(cartTotal(items, { coupon: 'SAVE5' })).toBe(54.4);
  });

  it('never lets SAVE5 take the goods below $0', () => {
    // Goods floor at $0; the cart isn't empty and is under $50, so shipping is charged.
    const items = [{ price: 3, quantity: 1 }];

    expect(cartTotal(items, { coupon: 'SAVE5' })).toBe(4.99);
  });

  describe('refuses any coupon code other than SAVE5', () => {
    const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    it.each(['SAVE10', 'save5', ''])('refuses the coupon code %j', (coupon) => {
      const items = [{ price: 10, quantity: 1 }];

      expect(() => cartTotal(items, { coupon })).toThrow(Error);
      expect(() => cartTotal(items, { coupon })).toThrow(new RegExp(`^Unknown coupon: ${escape(coupon)}$`));
    });
  });
});

describe('shipping', () => {
  it('ships free when the discounted goods come to exactly $50', () => {
    const items = [{ price: 55, quantity: 1 }];

    expect(cartTotal(items, { coupon: 'SAVE5' })).toBe(50);
  });

  it('charges $4.99 shipping when the goods come to $49.99', () => {
    const items = [{ price: 49.99, quantity: 1 }];

    expect(cartTotal(items)).toBe(54.98);
  });

  it('decides shipping on the goods after the bulk discount, not the subtotal', () => {
    // Subtotal $55, but $49.50 after the bulk discount, so shipping applies.
    const items = [{ price: 5, quantity: 11 }];

    expect(cartTotal(items)).toBe(54.49);
  });

  it('charges nothing for an empty cart, with or without SAVE5', () => {
    expect(cartTotal([])).toBe(0);
    expect(cartTotal([], { coupon: 'SAVE5' })).toBe(0);
  });
});
