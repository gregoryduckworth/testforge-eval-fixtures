// GAPS-20261122-43B1: TC1, TC2, TC3, TC4, TC5
import { describe, expect, it } from 'vitest';
import { UnknownCouponError, couponDiscount } from '../src/coupons.js';
import { thrownBy } from './thrown.js';

describe('couponDiscount', () => {
  it('SAVE10 takes 10% off, rounded down', () => {
    expect(couponDiscount('SAVE10', 1999)).toBe(199);
  });

  it('TENOFF takes £10 off', () => {
    expect(couponDiscount('TENOFF', 2500)).toBe(1000);
  });

  it('TENOFF never takes more than the total', () => {
    expect(couponDiscount('TENOFF', 600)).toBe(600);
  });

  it('matches a code whatever its case and the spaces around it', () => {
    expect(couponDiscount(' save10 ', 5000)).toBe(500);
  });

  it('refuses an unknown code', () => {
    const error = thrownBy(() => couponDiscount('SAVE20', 5000));

    expect(error).toBeInstanceOf(UnknownCouponError);
    expect(error.name).toBe('UnknownCouponError');
    expect(error.message).toContain('"SAVE20"');
  });
});
