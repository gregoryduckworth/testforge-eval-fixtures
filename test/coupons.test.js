// PR-GAPS-20261122-2BA9: TC1, TC2, TC3, TC4, TC5
import { describe, expect, it } from 'vitest';
import { couponDiscount, UnknownCouponError } from '../src/coupons.js';

describe('couponDiscount', () => {
  it('SAVE10 takes 10% off, rounded down', () => {
    expect(couponDiscount('SAVE10', 1999)).toBe(199);
  });

  it('TENOFF takes £10 off', () => {
    expect(couponDiscount('TENOFF', 2500)).toBe(1000);
  });

  it('TENOFF takes no more than the total', () => {
    expect(couponDiscount('TENOFF', 600)).toBe(600);
  });

  it('matches a code whatever its case and the spaces around it', () => {
    expect(couponDiscount(' save10 ', 2000)).toBe(200);
  });

  it('refuses an unknown code', () => {
    let error;
    try {
      couponDiscount('SAVE99', 2000);
    } catch (caught) {
      error = caught;
    }

    // Asserted outside the catch, so a call that doesn't throw fails here.
    expect(error).toBeInstanceOf(UnknownCouponError);
    expect(error.name).toBe('UnknownCouponError');
    expect(error.message).toContain('SAVE99');
  });
});
