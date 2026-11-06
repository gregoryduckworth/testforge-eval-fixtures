// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEFAULT_LIMIT, MAX_LIMIT, createApp } from '../src/app.js';
import { PRODUCTS } from '../src/catalogue.js';

let server;
let base;

beforeAll(async () => {
  server = createApp();
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

const get = (params) => fetch(`${base}/products?${new URLSearchParams(params)}`);
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
const numbered = (name, from, to) => range(from, to).map((n) => `${name} ${n}`);

describe('GET /products search and paging', () => {
  it('matches q against product names in any case', async () => {
    const response = await get({ q: 'tEaPoT', limit: '50' });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(15);
    expect(body.items.map((p) => p.name)).toEqual(numbered('Teapot', 1, 15));
    expect(body.items.map((p) => p.id)).toEqual(range(0, 14).map((i) => 3 + 8 * i));
  });

  it('matches q anywhere inside the name', async () => {
    const response = await get({ q: 'STRAINER', limit: '50' });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(15);
    expect(body.items.map((p) => p.name)).toEqual(numbered('Tea strainer', 1, 15));
  });

  it('lists every product when q is absent', async () => {
    const response = await fetch(`${base}/products`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual(range(1, DEFAULT_LIMIT));
  });

  it('returns the page at offset with limit items and the total of all matches', async () => {
    const response = await get({ q: 'teapot', limit: '5', offset: '5' });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(15);
    expect(body.items.map((p) => p.name)).toEqual(numbered('Teapot', 6, 10));
  });

  it('caps a large limit at the maximum page size', async () => {
    const response = await get({ limit: '1000' });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual(range(1, MAX_LIMIT));
  });

  it('returns no items but the full total when offset is past the last match', async () => {
    const response = await get({ q: 'teapot', offset: '15' });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 15, items: [] });
  });

  it('refuses a limit below 1 with 400', async () => {
    const response = await get({ limit: '0' });
    expect(response.status).toBe(400);
    expect(await response.json()).toHaveProperty('error');
  });

  it('refuses a limit that is not a whole number with 400', async () => {
    for (const limit of ['2.5', '-3', 'abc', '']) {
      const response = await get({ limit });
      expect(response.status, `limit=${limit}`).toBe(400);
    }
  });

  it('refuses an offset that is not a whole number with 400', async () => {
    for (const offset of ['1.5', '-1', 'abc']) {
      const response = await get({ offset });
      expect(response.status, `offset=${offset}`).toBe(400);
    }
  });

  it('accepts offset 0 and limit 1 as the smallest valid page', async () => {
    const response = await get({ limit: '1', offset: '0' });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual([1]);
  });
});
