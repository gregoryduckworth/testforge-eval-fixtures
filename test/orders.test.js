import { describe, expect, it } from 'vitest';
import { orderTotal, subtotal } from '../src/orders.js';

describe('orders', () => {
  it('adds up each line by its quantity', () => {
    expect(
      subtotal([
        { price: 1000, quantity: 2 },
        { price: 250, quantity: 4 },
      ]),
    ).toBe(3000);
  });

  it('adds shipping to a small order', () => {
    expect(orderTotal([{ price: 1000, quantity: 1 }])).toBe(1499);
  });
});
