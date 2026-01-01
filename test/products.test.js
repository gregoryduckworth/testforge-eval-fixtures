import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

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
