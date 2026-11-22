// GAPS-20261122-023F: TC1, TC2, TC3, TC4, TC5
import { describe, expect, it } from 'vitest';
import { UnknownCouponError, couponDiscount } from '../src/coupons.js';
import { thrownBy } from './support/thrown.js';

describe('coupons', () => {
  it('takes 10% off, rounded down, for SAVE10', () => {
    expect(couponDiscount('SAVE10', 1999)).toBe(199);
  });

  it('takes £10 off for TENOFF', () => {
    expect(couponDiscount('TENOFF', 5000)).toBe(1000);
  });

  it('never takes more than the total', () => {
    expect(couponDiscount('TENOFF', 600)).toBe(600);
  });

  it('matches a code whatever its case and the spaces around it', () => {
    expect(couponDiscount('  save10 ', 2000)).toBe(200);
  });

  it("refuses a code the shop doesn't take", () => {
    const error = thrownBy(() => couponDiscount('SAVE99', 5000));

    expect(error).toBeInstanceOf(UnknownCouponError);
    expect(error.name).toBe('UnknownCouponError');
    expect(error.message).toContain('"SAVE99"');
  });
});
