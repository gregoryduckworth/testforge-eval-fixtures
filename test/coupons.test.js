// GAPS-20261122-E2D4: TC1, TC2, TC3, TC4, TC5
import { describe, expect, it } from 'vitest';
import { couponDiscount } from '../src/coupons.js';

describe('coupons', () => {
  it('SAVE10 takes 10% off, rounded down', () => {
    expect(couponDiscount('SAVE10', 1999)).toBe(199);
  });

  it('TENOFF takes £10 off', () => {
    expect(couponDiscount('TENOFF', 5000)).toBe(1000);
  });

  it('TENOFF never takes off more than the total', () => {
    expect(couponDiscount('TENOFF', 600)).toBe(600);
  });

  it('matches a code whatever its case and the spaces around it', () => {
    expect(couponDiscount('  save10 ', 2000)).toBe(200);
  });

  it("refuses a code the shop doesn't take", () => {
    expect(() => couponDiscount('FREEBIE', 2000)).toThrow(
      expect.objectContaining({
        name: 'UnknownCouponError',
        message: expect.stringContaining('"FREEBIE"'),
      }),
    );
  });
});
