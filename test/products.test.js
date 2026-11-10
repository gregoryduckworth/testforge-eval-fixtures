import { describe, expect, it } from 'vitest';
import { useApp } from './support/server.js';

const appUrl = useApp();

describe('GET /products/:id', () => {
  it('returns the product', async () => {
    const response = await fetch(`${appUrl()}/products/1`);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: 1, name: 'Kettle 1' });
  });

  it('is 404 for an unknown id', async () => {
    const response = await fetch(`${appUrl()}/products/999`);
    expect(response.status).toBe(404);
  });
});
