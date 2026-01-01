import { describe, expect, it } from 'vitest';
import { inStock, shortages } from '../src/stock.js';

describe('stock', () => {
  it('covers an order the stock has enough of', () => {
    expect(inStock([{ sku: 'mug', quantity: 2 }], { mug: 2 })).toBe(true);
  });

  it('names each line the stock is short of, and by how many', () => {
    expect(
      shortages(
        [
          { sku: 'mug', quantity: 3 },
          { sku: 'cap', quantity: 1 },
        ],
        { mug: 1 },
      ),
    ).toEqual([
      { sku: 'mug', short: 2 },
      { sku: 'cap', short: 1 },
    ]);
  });
});
