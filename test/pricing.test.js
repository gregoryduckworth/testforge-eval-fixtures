// PR-GAPS-20261122-3E36: TC1, TC2, TC3, TC4, TC10, TC11, TC12
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

  it('takes 10% off a basket of 10 items across its lines', () => {
    expect(
      priceBasket([
        { unitPence: 300, quantity: 4 },
        { unitPence: 300, quantity: 6 },
      ]),
    ).toEqual({
      subtotal: 3000,
      discount: 300,
      total: 2700,
      items: 10,
    });
  });

  it('takes no bulk discount off 9 items', () => {
    expect(discountFor(4999, 9)).toBe(0);
  });

  it('takes the bulk discount instead of the spend discount when both apply', () => {
    expect(discountFor(5000, 10)).toBe(500);
  });

  it('rounds the bulk discount down', () => {
    expect(discountFor(1009, 10)).toBe(100);
  });

  it('takes a coupon off after the discount', () => {
    expect(priceBasket([{ unitPence: 2500, quantity: 3 }], { coupon: 'SAVE10' })).toEqual({
      subtotal: 7500,
      discount: 375,
      coupon: 712,
      total: 6413,
      items: 3,
    });
  });

  it('never prices a basket with a coupon below zero', () => {
    expect(priceBasket([{ unitPence: 600, quantity: 1 }], { coupon: 'TENOFF' })).toEqual({
      subtotal: 600,
      discount: 0,
      coupon: 600,
      total: 0,
      items: 1,
    });
  });

  it('refuses to price a basket with an unknown coupon', () => {
    let error;
    try {
      priceBasket([{ unitPence: 2500, quantity: 1 }], { coupon: 'NOPE' });
    } catch (thrown) {
      error = thrown;
    }

    expect(error).toBeInstanceOf(UnknownCouponError);
    expect(error.message).toContain('NOPE');
  });
});
