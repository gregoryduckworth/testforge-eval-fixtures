// CART-12: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11
import { describe, expect, it } from 'vitest';
import { cartTotal } from '../src/cart.js';

/** The error cartTotal throws for the cart and options, or undefined if it returns a price. */
function thrownBy(items, options) {
  try {
    cartTotal(items, options);
  } catch (error) {
    return error;
  }
  return undefined;
}

describe('cartTotal', () => {
  // Defect: the code compares itemCount > BULK_THRESHOLD, so exactly 10 items get no discount.
  it.fails('gives 10% off a cart of exactly 10 items', () => {
    expect(cartTotal([{ price: 3, quantity: 10 }])).toBe(31.99);
  });

  it('gives no bulk discount to a cart of 9 items', () => {
    expect(cartTotal([{ price: 3, quantity: 9 }])).toBe(31.99);
  });

  it("counts items by adding up each line's quantity for the bulk discount", () => {
    expect(
      cartTotal([
        { price: 2, quantity: 4 },
        { price: 2, quantity: 7 },
      ]),
    ).toBe(24.79);
  });

  it('takes SAVE5 off after the bulk discount', () => {
    expect(cartTotal([{ price: 5, quantity: 12 }], { coupon: 'SAVE5' })).toBe(53.99);
  });

  it('never lets SAVE5 take the goods below $0', () => {
    expect(cartTotal([{ price: 3, quantity: 1 }], { coupon: 'SAVE5' })).toBe(4.99);
  });

  it('refuses an unknown coupon code with an error', () => {
    const error = thrownBy([{ price: 3, quantity: 1 }], { coupon: 'SAVE10' });

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain('SAVE10');
  });

  // Defect: `coupon in COUPONS` accepts inherited keys such as 'constructor', returning NaN.
  it.fails('refuses a coupon code named like a built-in object property', () => {
    const error = thrownBy([{ price: 3, quantity: 1 }], { coupon: 'constructor' });

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain('constructor');
  });

  it('ships free when the goods cost exactly $50', () => {
    expect(cartTotal([{ price: 50, quantity: 1 }])).toBe(50);
  });

  it('charges $4.99 shipping when discounts bring the goods below $50', () => {
    expect(cartTotal([{ price: 5, quantity: 11 }])).toBe(54.49);
  });

  it('charges $4.99 shipping on goods of $49.99', () => {
    expect(cartTotal([{ price: 49.99, quantity: 1 }])).toBe(54.98);
  });

  it('charges nothing for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });
});
