// GAPS-20261122-43B1: TC6, TC7, TC8, TC9, TC10, TC11
import { describe, expect, it } from 'vitest';
import { UnknownCouponError } from '../src/coupons.js';
import { discountFor, priceBasket } from '../src/pricing.js';
import { thrownBy } from './thrown.js';

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
    const lines = [
      { unitPence: 100, quantity: 4 },
      { unitPence: 100, quantity: 6 },
    ];

    expect(priceBasket(lines)).toEqual({ subtotal: 1000, discount: 100, total: 900, items: 10 });
  });

  it('gives no bulk discount for 9 items', () => {
    expect(discountFor(1000, 9)).toBe(0);
  });

  it('gives the bulk discount instead of the spend discount when both apply', () => {
    expect(discountFor(6000, 10)).toBe(600);
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

  it('never prices a basket below zero with TENOFF', () => {
    expect(priceBasket([{ unitPence: 300, quantity: 2 }], { coupon: 'TENOFF' })).toEqual({
      subtotal: 600,
      discount: 0,
      coupon: 600,
      total: 0,
      items: 2,
    });
  });

  it('refuses to price a basket with an unknown coupon', () => {
    const error = thrownBy(() => priceBasket([{ unitPence: 2500, quantity: 1 }], { coupon: 'NOPE' }));

    expect(error).toBeInstanceOf(UnknownCouponError);
    expect(error.message).toContain('"NOPE"');
  });
});
