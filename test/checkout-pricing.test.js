// SHOP-40: TC3, TC7, TC8, TC9, TC10, TC11
import { describe, expect, it } from 'vitest';
import { UnknownCouponError } from '../src/coupons.js';
import { discountFor, priceBasket } from '../src/pricing.js';

describe('checkout pricing', () => {
  it('TENOFF never takes a discounted basket below zero', () => {
    // 1050p less the 105p bulk discount leaves 945p: the coupon takes only that.
    expect(priceBasket([{ unitPence: 105, quantity: 10 }], { coupon: 'TENOFF' })).toEqual({
      subtotal: 1050,
      discount: 105,
      coupon: 945,
      total: 0,
      items: 10,
    });
  });

  it('refuses to price a basket with an unknown coupon', () => {
    expect(() => priceBasket([{ unitPence: 2500, quantity: 3 }], { coupon: 'BOGUS' })).toThrow(
      UnknownCouponError,
    );
  });

  it('SAVE10 comes off after the spend discount', () => {
    // 10% of 7125p (after the 375p spend discount), not of the 7500p subtotal.
    expect(priceBasket([{ unitPence: 2500, quantity: 3 }], { coupon: 'SAVE10' })).toEqual({
      subtotal: 7500,
      discount: 375,
      coupon: 712,
      total: 6413,
      items: 3,
    });
  });

  it('gives 10% off for 10 items across lines when that beats the spend discount', () => {
    expect(
      priceBasket([
        { unitPence: 600, quantity: 4 },
        { unitPence: 600, quantity: 6 },
      ]),
    ).toEqual({
      subtotal: 6000,
      discount: 600,
      total: 5400,
      items: 10,
    });
  });

  it('gives 10% off for 10 items under £50', () => {
    expect(discountFor(3000, 10)).toBe(300);
  });

  it('gives only the spend discount for 9 items', () => {
    expect(discountFor(9000, 9)).toBe(450);
  });
});
