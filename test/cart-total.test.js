// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10
import { describe, expect, it } from 'vitest';
import { bulkDiscount, cartTotal } from '../src/cart.js';

describe('bulk discount', () => {
  // Suspected defect: bulkDiscount checks `itemCount > BULK_THRESHOLD`, so exactly 10 items gets no
  // discount although the ticket (and BULK_THRESHOLD's doc comment) say 10 or more. Remove `.fails` once fixed.
  it.fails('gives 10% off a cart of exactly 10 items', () => {
    // $100 of goods, less 10%, ships free.
    expect(cartTotal([{ price: 10, quantity: 10 }])).toBe(90);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    expect(cartTotal([{ price: 10, quantity: 9 }])).toBe(90);
  });

  it("counts the bulk threshold across every line's quantity", () => {
    const items = [
      { price: 10, quantity: 4 },
      { price: 10, quantity: 4 },
      { price: 10, quantity: 4 },
    ];

    expect(bulkDiscount(items)).toBe(12);
  });
});

describe('coupons', () => {
  it('takes SAVE5 off after the bulk discount', () => {
    // 55 - 5.50 bulk = 49.50, - 5 coupon = 44.50, + 4.99 shipping. Coupon first would give 49.99.
    expect(cartTotal([{ price: 5, quantity: 11 }], { coupon: 'SAVE5' })).toBe(49.49);
  });

  it('never lets SAVE5 take the goods below $0', () => {
    // Goods floor at $0; the cart is not empty, so shipping still applies.
    expect(cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' })).toBe(4.99);
  });

  it.each([{ coupon: 'SAVE10' }, { coupon: 'save5' }])(
    'refuses any coupon code other than SAVE5: $coupon',
    ({ coupon }) => {
      const items = [{ price: 10, quantity: 1 }];

      expect(() => cartTotal(items, { coupon })).toThrow(Error);
      expect(() => cartTotal(items, { coupon })).toThrow(new RegExp(`\\b${coupon}$`));
    },
  );
});

describe('shipping', () => {
  it('charges shipping when discounts bring the goods below $50', () => {
    // Subtotal 55, goods 49.50 after the bulk discount, + 4.99 shipping.
    expect(cartTotal([{ price: 5, quantity: 11 }])).toBe(54.49);
  });

  it('ships free when the goods cost exactly $50', () => {
    expect(cartTotal([{ price: 50, quantity: 1 }])).toBe(50);
  });

  it('charges $4.99 shipping on goods just under $50', () => {
    expect(cartTotal([{ price: 49.99, quantity: 1 }])).toBe(54.98);
  });

  it('charges nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });
});
