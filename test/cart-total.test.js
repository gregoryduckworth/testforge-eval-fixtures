// CART-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8
import { describe, expect, it } from 'vitest';
import { SHIPPING, cartTotal } from '../src/cart.js';

describe('cartTotal bulk discount', () => {
  // Suspected defect: bulkDiscount in src/cart.js checks itemCount > BULK_THRESHOLD, so a cart of
  // exactly 10 items ("at least this many") gets no discount and costs 100 instead of 90.
  it.fails('gives the bulk discount to a single line of exactly 10 items', () => {
    const total = cartTotal([{ price: 10, quantity: 10 }]);

    expect(total).toBe(90);
  });

  // Same suspected defect as above, with the 10 items counted across two lines.
  it.fails('gives the bulk discount to 10 items spread over several lines', () => {
    const total = cartTotal([
      { price: 10, quantity: 4 },
      { price: 10, quantity: 6 },
    ]);

    expect(total).toBe(90);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    const total = cartTotal([{ price: 10, quantity: 9 }]);

    expect(total).toBe(90);
  });

  it('gives the bulk discount to 11 items spread over two lines', () => {
    const total = cartTotal([
      { price: 10, quantity: 5 },
      { price: 10, quantity: 6 },
    ]);

    expect(total).toBe(99);
  });
});

describe('cartTotal with a coupon', () => {
  it('charges only shipping for a $3 cart with SAVE5', () => {
    const total = cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' });

    expect(total).toBe(SHIPPING);
  });

  it('charges only shipping when SAVE5 equals the goods value', () => {
    const total = cartTotal([{ price: 5, quantity: 1 }], { coupon: 'SAVE5' });

    expect(total).toBe(SHIPPING);
  });

  it('takes $5 off a $20 cart with SAVE5', () => {
    const total = cartTotal([{ price: 20, quantity: 1 }], { coupon: 'SAVE5' });

    expect(total).toBe(19.99);
  });

  it('refuses an unknown coupon', () => {
    const priceWithUnknownCoupon = () => cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE50' });

    expect(priceWithUnknownCoupon).toThrow(/^Unknown coupon: SAVE50$/);
  });
});
