// SHOP-40: TC12, TC13, TC14
import { describe, expect, it } from 'vitest';
import { formatPence } from '../src/format.js';

describe('formatPence edge amounts', () => {
  it('shows an amount under £1 with a leading zero', () => {
    expect(formatPence(7)).toBe('£0.07');
  });

  it('shows whole pounds with two zeros', () => {
    expect(formatPence(2000)).toBe('£20.00');
  });

  it('shows a refund under £1 with a minus sign', () => {
    expect(formatPence(-5)).toBe('-£0.05');
  });
});
