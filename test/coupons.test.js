// GAPS-20261122-ED63: TC8, TC9, TC10
import { describe, expect, it } from 'vitest';
import { couponDiscount } from '../src/coupons.js';

describe('coupons', () => {
  it('takes £10 off with TENOFF', () => {
    expect(couponDiscount('TENOFF', 3000)).toBe(1000);
  });

  it('rounds a SAVE10 discount down', () => {
    expect(couponDiscount('SAVE10', 1999)).toBe(199);
  });

  it('matches a code whatever its case and surrounding spaces', () => {
    expect(couponDiscount(' save10 ', 2000)).toBe(200);
  });
});
