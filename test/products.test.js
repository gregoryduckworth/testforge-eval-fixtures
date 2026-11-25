import { describe, expect, it } from 'vitest';
import { useApp } from './helpers/server.js';

const baseUrl = useApp();

describe('GET /products/:id', () => {
  it('returns the product', async () => {
    const response = await fetch(`${baseUrl()}/products/1`);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: 1, name: 'Kettle 1' });
  });

  it('is 404 for an unknown id', async () => {
    const response = await fetch(`${baseUrl()}/products/999`);
    expect(response.status).toBe(404);
  });
});
