// GAPS-20261122-E2D4: TC6, TC7, TC8, TC9
import { describe, expect, it } from 'vitest';
import { UnknownCouponError } from '../src/coupons.js';
import { discountFor, priceBasket } from '../src/pricing.js';

describe('pricing', () => {
  it('takes nothing off below £50', () => {
    expect(discountFor(4999)).toBe(0);
  });

  it('takes 5% off from £50', () => {
    expect(discountFor(5000)).toBe(250);
  });

  it('prices a basket with its discount', () => {
    expect(priceBasket([{ unitPence: 2500, quantity: 3 }])).toEqual({
      subtotal: 7500,
      discount: 375,
      total: 7125,
      items: 3,
    });
  });

  it('takes 10% off 10 or more items across lines when that beats the spend discount', () => {
    const lines = [
      { unitPence: 1000, quantity: 6 },
      { unitPence: 1000, quantity: 4 },
    ];

    expect(priceBasket(lines)).toEqual({
      subtotal: 10000,
      discount: 1000,
      total: 9000,
      items: 10,
    });
  });

  it('gives no bulk discount for 9 items', () => {
    expect(discountFor(2700, 9)).toBe(0);
  });

  it('takes a coupon off after the discount and says what it took', () => {
    expect(priceBasket([{ unitPence: 1000, quantity: 6 }], { coupon: 'SAVE10' })).toEqual({
      subtotal: 6000,
      discount: 300,
      coupon: 570,
      total: 5130,
      items: 6,
    });
  });

  it('refuses to price a basket with an unknown coupon', () => {
    expect(() => priceBasket([{ unitPence: 1000, quantity: 1 }], { coupon: 'NOPE' })).toThrow(
      UnknownCouponError,
    );
  });
});
