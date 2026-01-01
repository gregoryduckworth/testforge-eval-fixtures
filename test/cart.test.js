import { describe, expect, it } from 'vitest';
import { itemCount, lineTotal, subtotal } from '../src/cart.js';

describe('cart', () => {
  it('totals a line as its unit price times its quantity', () => {
    expect(lineTotal({ unitPence: 450, quantity: 3 })).toBe(1350);
  });

  it('refuses a line with no items', () => {
    expect(() => lineTotal({ unitPence: 450, quantity: 0 })).toThrow(RangeError);
  });

  it('adds up the lines of a basket', () => {
    expect(
      subtotal([
        { unitPence: 450, quantity: 2 },
        { unitPence: 1200, quantity: 1 },
      ]),
    ).toBe(2100);
  });

  it('counts the items across the lines', () => {
    expect(
      itemCount([
        { unitPence: 450, quantity: 2 },
        { unitPence: 1200, quantity: 3 },
      ]),
    ).toBe(5);
  });
});
