// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../src/app.js';
import { PRODUCTS } from '../src/catalogue.js';
import { startServer } from './helpers/server.js';

let app;
let base;

beforeAll(async () => {
  app = await startServer();
  base = app.base;
});

afterAll(() => app.close());

const get = (query) => fetch(`${base}/products${query}`);
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

// Tea matches (Teapot and Tea strainer) are ids 3, 7, 11, ..., 119.
const TEA_IDS = Array.from({ length: 30 }, (_, k) => 4 * k + 3);

// Names alternate Teapot n, Tea strainer n, with n from 1 to 15 each.
const TEA_NAMES = Array.from({ length: 30 }, (_, k) =>
  k % 2 === 0 ? `Teapot ${k / 2 + 1}` : `Tea strainer ${(k - 1) / 2 + 1}`,
);

describe('GET /products search and paging', () => {
  it('matches product names containing q in any case', async () => {
    const response = await get('?q=tEA&limit=50');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(30);
    expect(body.items.map((p) => p.id)).toEqual(TEA_IDS);
    expect(body.items.map((p) => p.name)).toEqual(TEA_NAMES);
  });

  it('lists every product when q is absent', async () => {
    const response = await get('');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual(range(1, DEFAULT_LIMIT));
  });

  it('returns no items and a total of 0 when nothing matches q', async () => {
    const response = await get('?q=blender');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 0, items: [] });
  });

  it('returns the requested page of matches with the total of all matches', async () => {
    const response = await get('?q=tea&limit=5&offset=5');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(30);
    expect(body.items.map((p) => p.id)).toEqual([23, 27, 31, 35, 39]);
    expect(body.items.map((p) => p.name)).toEqual([
      'Tea strainer 3',
      'Teapot 4',
      'Tea strainer 4',
      'Teapot 5',
      'Tea strainer 5',
    ]);
  });

  it('caps a large limit at the maximum page size', async () => {
    const response = await get('?limit=1000');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.items.map((p) => p.id)).toEqual(range(1, MAX_LIMIT));
    expect(body.total).toBe(120);
  });

  it('returns a full page when limit equals the maximum', async () => {
    for (const limit of [MAX_LIMIT, MAX_LIMIT + 1]) {
      const response = await get(`?limit=${limit}`);
      expect.soft(response.status, `limit=${limit}`).toBe(200);
      const body = await response.json();
      expect.soft(body.items, `limit=${limit}`).toHaveLength(MAX_LIMIT);
    }
  });

  it('returns no items but the full total when offset is past the last match', async () => {
    const response = await get('?q=tea&offset=30');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 30, items: [] });
  });

  it('refuses a limit that is not a whole number with 400', async () => {
    for (const v of ['abc', '2.5', '-1', '1e2', '']) {
      const response = await get(`?limit=${encodeURIComponent(v)}`);
      expect.soft(response.status, `limit=${v}`).toBe(400);
    }
  });

  it('refuses a limit of 0 with 400 and accepts a limit of 1', async () => {
    const zero = await get('?limit=0');
    expect(zero.status).toBe(400);
    const one = await get('?limit=1');
    expect(one.status).toBe(200);
    const body = await one.json();
    expect(body.items.map((p) => p.id)).toEqual([1]);
  });

  it('refuses an offset that is not a whole number with 400', async () => {
    for (const v of ['abc', '1.5', '-1', '']) {
      const response = await get(`?offset=${encodeURIComponent(v)}`);
      expect.soft(response.status, `offset=${v}`).toBe(400);
    }
    const zero = await get('?offset=0');
    expect(zero.status).toBe(200);
  });
});
