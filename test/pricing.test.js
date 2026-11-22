// PR-GAPS-20261122-2BA9: TC6, TC7, TC8, TC9, TC10, TC11, TC12
import { describe, expect, it } from 'vitest';
import { UnknownCouponError } from '../src/coupons.js';
import { BULK_ITEMS, discountFor, priceBasket } from '../src/pricing.js';

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

  it('takes 10% off 10 items below £50', () => {
    expect(discountFor(4000, BULK_ITEMS)).toBe(400);
  });

  it('gives no bulk discount for 9 items', () => {
    expect(discountFor(4000, BULK_ITEMS - 1)).toBe(0);
  });

  it('takes the bulk discount when it is more than the spend discount', () => {
    expect(discountFor(6000, BULK_ITEMS)).toBe(600);
  });

  it('counts items across lines for the bulk discount', () => {
    expect(
      priceBasket([
        { unitPence: 400, quantity: 4 },
        { unitPence: 400, quantity: 6 },
      ]),
    ).toEqual({ subtotal: 4000, discount: 400, total: 3600, items: 10 });
  });

  it('takes a coupon off after the discount', () => {
    expect(priceBasket([{ unitPence: 2500, quantity: 4 }], { coupon: 'SAVE10' })).toEqual({
      subtotal: 10000,
      discount: 500,
      coupon: 950,
      total: 8550,
      items: 4,
    });
  });

  it('never takes a basket below zero with TENOFF', () => {
    expect(priceBasket([{ unitPence: 105, quantity: 10 }], { coupon: 'TENOFF' })).toEqual({
      subtotal: 1050,
      discount: 105,
      coupon: 945,
      total: 0,
      items: 10,
    });
  });

  it('refuses a basket with an unknown coupon', () => {
    let error;
    try {
      priceBasket([{ unitPence: 2500, quantity: 1 }], { coupon: 'NOPE' });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(UnknownCouponError);
    expect(error.message).toContain('NOPE');
  });
});
