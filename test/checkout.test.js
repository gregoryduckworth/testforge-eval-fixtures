// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10
import { describe, expect, it } from 'vitest';
import { cartTotal, SHIPPING } from '../src/cart.js';

describe('cartTotal bulk discount', () => {
  // Expected to fail: bulkDiscount in src/cart.js checks `itemCount > BULK_THRESHOLD`, so a cart
  // of exactly 10 items gets no discount, though CART-12 grants it at "10 or more".
  it.fails('gives 10% off a cart of exactly 10 items spread over several lines', () => {
    const items = [
      { price: 10, quantity: 4 },
      { price: 5, quantity: 6 },
    ];

    expect(cartTotal(items)).toBe(63);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    expect(cartTotal([{ price: 10, quantity: 9 }])).toBe(90);
  });

  it('counts items by quantity, not by line, for the bulk discount', () => {
    expect(cartTotal([{ price: 5, quantity: 12 }])).toBe(54);
  });
});

describe('cartTotal coupons', () => {
  it('takes SAVE5 off after the bulk discount', () => {
    // 60 - 6 (bulk) - 5 (coupon) = 49 goods, below free shipping.
    expect(cartTotal([{ price: 5, quantity: 12 }], { coupon: 'SAVE5' })).toBe(53.99);
  });

  it('never lets SAVE5 take the goods below $0', () => {
    expect(cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' })).toBe(SHIPPING);
  });

  it('refuses an unknown coupon code with an error', () => {
    const items = [{ price: 20, quantity: 1 }];

    expect(() => cartTotal(items, { coupon: 'SAVE10' })).toThrow('SAVE10');
    expect(() => cartTotal(items, { coupon: 'save5' })).toThrow('save5');
  });

  // Expected to fail: cartTotal looks coupons up with `coupon in COUPONS`, which matches inherited
  // Object.prototype keys, so 'toString' is accepted (and the total becomes NaN) instead of refused.
  it.fails('refuses a coupon code that names a built-in object property', () => {
    expect(() => cartTotal([{ price: 20, quantity: 1 }], { coupon: 'toString' })).toThrow(
      'toString',
    );
  });
});

describe('cartTotal shipping', () => {
  it('ships free when the goods reach exactly $50 after discounts', () => {
    expect(cartTotal([{ price: 55, quantity: 1 }], { coupon: 'SAVE5' })).toBe(50);
  });

  it('charges $4.99 shipping when the goods cost less than $50', () => {
    expect(cartTotal([{ price: 49.99, quantity: 1 }])).toBe(54.98);
  });

  it('charges nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
    expect(cartTotal([], { coupon: 'SAVE5' })).toBe(0);
  });
});
