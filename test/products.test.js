// GAPS-20261122-D6E4: TC1, TC2
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { PRODUCTS } from '../src/store.js';

let server;
let base;

beforeAll(async () => {
  server = createApp();
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

describe('GET /products', () => {
  it('lists every product', async () => {
    const response = await fetch(`${base}/products`);
    expect(response.status).toBe(200);
    const { items } = await response.json();
    expect(items.map((p) => p.name)).toEqual(['Kettle', 'Teapot', 'Mug', 'Tea towel']);
  });

  it('lists the products whose name contains q, in any case', async () => {
    const response = await fetch(`${base}/products?q=TEA`);
    const { items } = await response.json();
    expect(items.map((p) => p.name)).toEqual(['Teapot', 'Tea towel']);
  });
});

describe('GET /products/{id}', () => {
  it('returns one product', async () => {
    const teapot = PRODUCTS.find((p) => p.id === 2);
    const response = await fetch(`${base}/products/2`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(await response.json()).toEqual({ id: 2, name: 'Teapot', priceCents: teapot.priceCents, stock: teapot.stock });
  });

  it('is 404 for an unknown product', async () => {
    const response = await fetch(`${base}/products/99`);
    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(await response.json()).toEqual({ error: expect.any(String) });
  });
});
