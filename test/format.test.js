import { describe, expect, it } from 'vitest';
import { formatPence } from '../src/format.js';

describe('formatPence', () => {
  it('shows pounds and pence', () => {
    expect(formatPence(1250)).toBe('£12.50');
  });

  it('pads the pence', () => {
    expect(formatPence(305)).toBe('£3.05');
  });

  it('shows a refund with a minus sign', () => {
    expect(formatPence(-499)).toBe('-£4.99');
  });
});
