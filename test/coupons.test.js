// PR-GAPS-20261122-0FD1: TC1, TC2, TC3, TC4, TC5
import { describe, expect, it } from 'vitest';
import { UnknownCouponError, couponDiscount } from '../src/coupons.js';

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

  it('matches a code whatever its case and surrounding spaces', () => {
    expect(couponDiscount('  save10 ', 2000)).toBe(200);
  });

  it('refuses an unknown code with UnknownCouponError', () => {
    const act = () => couponDiscount('SAVE99', 2000);

    expect(act).toThrow(UnknownCouponError);
    expect(act).toThrow(expect.objectContaining({ name: 'UnknownCouponError' }));
    expect(act).toThrow('"SAVE99"');
  });
});
