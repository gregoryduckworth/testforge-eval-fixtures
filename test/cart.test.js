import { describe, expect, it } from 'vitest';
import { subtotal } from '../src/cart.js';

describe('subtotal', () => {
  it('adds up each line by its quantity', () => {
    expect(
      subtotal([
        { price: 2.5, quantity: 2 },
        { price: 1.25, quantity: 4 },
      ]),
    ).toBe(10);
  });

  it('is zero for an empty cart', () => {
    expect(subtotal([])).toBe(0);
  });
});
