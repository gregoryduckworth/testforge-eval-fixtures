// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9
import { describe, expect, it } from 'vitest';
import { bulkDiscount, cartTotal } from '../src/cart.js';

describe('bulkDiscount', () => {
  // Expected to fail: suspected defect. bulkDiscount uses `itemCount > BULK_THRESHOLD`, so a cart
  // of exactly 10 items gets no discount, though the ticket says 10 or more qualify.
  it.fails('gives 10% off a cart of exactly 10 items spread over several lines', () => {
    const items = [
      { price: 2, quantity: 4 },
      { price: 3, quantity: 6 },
    ];

    expect(bulkDiscount(items)).toBe(2.6);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    const items = [
      { price: 2, quantity: 4 },
      { price: 3, quantity: 5 },
    ];

    expect(bulkDiscount(items)).toBe(0);
  });

  it('gives 10% off a cart of 11 items', () => {
    expect(bulkDiscount([{ price: 4, quantity: 11 }])).toBe(4.4);
  });
});

describe('cartTotal', () => {
  it('takes SAVE5 off after the bulk discount', () => {
    // 60 - 6 (bulk) - 5 (coupon) = 49 goods, + 4.99 shipping. Coupon first would give 54.49.
    expect(cartTotal([{ price: 5, quantity: 12 }], { coupon: 'SAVE5' })).toBe(53.99);
  });

  it('never prices the goods below $0 with SAVE5', () => {
    // Goods floor at 0; the non-empty cart still pays shipping.
    expect(cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' })).toBe(4.99);
  });

  it.each([
    { coupon: 'SAVE10', message: /: SAVE10$/ },
    { coupon: 'save5', message: /: save5$/ },
  ])('refuses a coupon code other than SAVE5: $coupon', ({ coupon, message }) => {
    const items = [{ price: 20, quantity: 1 }];

    expect(() => cartTotal(items, { coupon })).toThrow(Error);
    expect(() => cartTotal(items, { coupon })).toThrow(message);
  });

  it('ships free when the discounted goods cost exactly $50', () => {
    expect(cartTotal([{ price: 55, quantity: 1 }], { coupon: 'SAVE5' })).toBe(50);
  });

  it('charges $4.99 shipping when discounts bring the goods under $50', () => {
    expect(cartTotal([{ price: 54, quantity: 1 }], { coupon: 'SAVE5' })).toBe(53.99);
  });

  it('charges nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });
});
