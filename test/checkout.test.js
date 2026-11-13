// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11
import { describe, expect, it } from 'vitest';
import { cartTotal } from '../src/cart.js';

describe('cartTotal bulk discount', () => {
  // Suspected defect: bulkDiscount compares itemCount(items) > BULK_THRESHOLD, so a cart of exactly
  // 10 items gets no discount, although the ticket (and BULK_THRESHOLD's own comment) say "10 or more".
  it.fails('gives 10% off a cart of exactly 10 items spread over several lines', () => {
    const total = cartTotal([
      { price: 6, quantity: 4 },
      { price: 6, quantity: 6 },
    ]);

    expect(total).toBe(54);
  });

  it('gives 10% off a cart of 11 items spread over several lines', () => {
    const total = cartTotal([
      { price: 10, quantity: 5 },
      { price: 10, quantity: 6 },
    ]);

    expect(total).toBe(99);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    const total = cartTotal([
      { price: 10, quantity: 4 },
      { price: 10, quantity: 5 },
    ]);

    expect(total).toBe(90);
  });
});

describe('cartTotal coupons', () => {
  it('takes SAVE5 off after the bulk discount', () => {
    // 110 - 11 (bulk) - 5 = 94; applying the coupon first would give 94.5.
    const total = cartTotal([{ price: 10, quantity: 11 }], { coupon: 'SAVE5' });

    expect(total).toBe(94);
  });

  it('never lets SAVE5 take the goods below $0', () => {
    // Goods floor at 0, plus shipping; without the floor it would be 2.99.
    const total = cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' });

    expect(total).toBe(4.99);
  });

  it.each(['SAVE10', 'save5', ''])('refuses coupon code %j with an error naming it', (code) => {
    const checkout = () => cartTotal([{ price: 20, quantity: 1 }], { coupon: code });

    expect(checkout).toThrow(new Error(`Unknown coupon: ${code}`));
  });
});

describe('cartTotal shipping', () => {
  it('ships free when the goods cost exactly $50', () => {
    const total = cartTotal([{ price: 25, quantity: 2 }]);

    expect(total).toBe(50);
  });

  it('charges $4.99 shipping when discounts bring goods under $50', () => {
    // Subtotal 52 is over the threshold, but the goods cost 47 after SAVE5.
    const total = cartTotal([{ price: 52, quantity: 1 }], { coupon: 'SAVE5' });

    expect(total).toBe(51.99);
  });

  it('charges $4.99 shipping when the goods cost $49.99', () => {
    const total = cartTotal([{ price: 49.99, quantity: 1 }]);

    expect(total).toBe(54.98);
  });

  it('charges nothing for an empty cart', () => {
    const total = cartTotal([]);

    expect(total).toBe(0);
  });

  it('charges nothing for an empty cart with SAVE5', () => {
    const total = cartTotal([], { coupon: 'SAVE5' });

    expect(total).toBe(0);
  });
});
