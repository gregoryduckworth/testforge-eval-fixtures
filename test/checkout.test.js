// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11
import { describe, expect, it } from 'vitest';
import { cartTotal } from '../src/cart.js';

const captureError = (act) => {
  try {
    act();
  } catch (error) {
    return error;
  }
  throw new Error('expected the call to throw, but it returned');
};

describe('cartTotal bulk discount', () => {
  // Suspected defect: bulkDiscount in src/cart.js uses `itemCount > BULK_THRESHOLD`, so a cart of
  // exactly 10 items gets no discount, while the ticket gives it to carts of 10 or more.
  it.fails('gives 10% off a cart of exactly 10 items spread over several lines', () => {
    const total = cartTotal([
      { price: 10, quantity: 4 },
      { price: 10, quantity: 6 },
    ]);

    expect(total).toBe(90);
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
    // Goods floor at 0, plus shipping; negative goods would give 2.99.
    const total = cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' });

    expect(total).toBe(4.99);
  });

  it.each([{ code: 'SAVE10' }, { code: 'save5' }])(
    'refuses the coupon code $code with an error',
    ({ code }) => {
      const error = captureError(() => cartTotal([{ price: 10, quantity: 1 }], { coupon: code }));

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain(code);
    },
  );

  it('refuses an empty coupon code with an error', () => {
    const error = captureError(() => cartTotal([{ price: 10, quantity: 1 }], { coupon: '' }));

    expect(error).toBeInstanceOf(Error);
  });
});

describe('cartTotal shipping', () => {
  it('ships free when the goods cost exactly $50 after discounts', () => {
    const total = cartTotal([{ price: 55, quantity: 1 }], { coupon: 'SAVE5' });

    expect(total).toBe(50);
  });

  it('charges $4.99 shipping when the bulk discount takes the goods below $50', () => {
    // Subtotal 55, goods 49.50 after the bulk discount; shipping on the subtotal would give 49.5.
    const total = cartTotal([{ price: 5, quantity: 11 }]);

    expect(total).toBe(54.49);
  });

  it('charges $4.99 shipping on goods just under $50', () => {
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
