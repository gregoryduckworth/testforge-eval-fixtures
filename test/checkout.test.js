// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10
import { describe, expect, it } from 'vitest';
import { cartTotal } from '../src/cart.js';

describe('cartTotal bulk discount', () => {
  // Expected to fail: bulkDiscount in src/cart.js compares itemCount > BULK_THRESHOLD, so a cart
  // of exactly 10 items gets no discount, while the ticket gives 10% off at 10 or more items.
  it.fails('gives 10% off a cart of exactly 10 items spread over several lines', () => {
    const items = [
      { price: 10, quantity: 4 },
      { price: 10, quantity: 6 },
    ];

    const total = cartTotal(items);

    expect(total).toBe(90);
  });

  it('gives 10% off a cart of 11 items spread over several lines', () => {
    const items = [
      { price: 10, quantity: 5 },
      { price: 10, quantity: 6 },
    ];

    const total = cartTotal(items);

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

describe('cartTotal coupons', () => {
  it('takes SAVE5 off after the bulk discount', () => {
    // 110 less 10% is 99, less $5 is 94; taking the coupon off first would give 94.5.
    const total = cartTotal([{ price: 10, quantity: 11 }], { coupon: 'SAVE5' });

    expect(total).toBe(94);
  });

  it('never prices the goods below $0 with SAVE5', () => {
    // Goods floor at 0 (not -2), then shipping is added because 0 is under the free shipping threshold.
    const total = cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' });

    expect(total).toBe(4.99);
  });

  it.each(['SAVE10', 'save5', ''])('refuses coupon %j with an error naming it', (coupon) => {
    const price = () => cartTotal([{ price: 20, quantity: 1 }], { coupon });

    expect(price).toThrow(new Error(`Unknown coupon: ${coupon}`));
  });
});

describe('cartTotal shipping', () => {
  it('charges $4.99 shipping when discounts bring goods under $50', () => {
    // The subtotal is 52, but the goods cost 47 after SAVE5.
    const total = cartTotal([{ price: 52, quantity: 1 }], { coupon: 'SAVE5' });

    expect(total).toBe(51.99);
  });

  it('ships free when goods cost exactly $50', () => {
    const total = cartTotal([{ price: 25, quantity: 2 }]);

    expect(total).toBe(50);
  });

  it('charges $4.99 shipping when goods cost $49.99', () => {
    const total = cartTotal([{ price: 49.99, quantity: 1 }]);

    expect(total).toBe(54.98);
  });

  it('charges nothing for an empty cart', () => {
    const total = cartTotal([]);

    expect(total).toBe(0);
  });
});
