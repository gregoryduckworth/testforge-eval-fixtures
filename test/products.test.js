import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startServer } from './support/server.js';

let base;
let close;

beforeAll(async () => {
  ({ base, close } = await startServer());
});

afterAll(() => close());

describe('GET /products/:id', () => {
  it('returns the product', async () => {
    const response = await fetch(`${base}/products/1`);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: 1, name: 'Kettle 1' });
  });

  it('is 404 for an unknown id', async () => {
    const response = await fetch(`${base}/products/999`);
    expect(response.status).toBe(404);
  });
});
