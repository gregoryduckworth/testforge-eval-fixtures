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

async function get(query) {
  const response = await fetch(`${base}/products?${query}`);
  return { status: response.status, body: await response.json() };
}

describe('GET /products search', () => {
  it('matches q anywhere in the name regardless of case', async () => {
    const { status, body } = await get('q=EAPO&limit=50');
    expect(status).toBe(200);
    expect(body.total).toBe(15);
    expect(body.items.map((p) => p.name)).toEqual(
      Array.from({ length: 15 }, (_, i) => `Teapot ${i + 1}`),
    );
  });

  it('lists every product when q is absent', async () => {
    const { status, body } = await get('');
    expect(status).toBe(200);
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual(PRODUCTS.slice(0, DEFAULT_LIMIT).map((p) => p.id));
  });

  it('returns an empty page when nothing matches q', async () => {
    const { status, body } = await get('q=bicycle');
    expect(status).toBe(200);
    expect(body).toEqual({ total: 0, items: [] });
  });
});

describe('GET /products paging', () => {
  it('returns the page selected by limit and offset', async () => {
    const { status, body } = await get('limit=5&offset=10');
    expect(status).toBe(200);
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual([11, 12, 13, 14, 15]);
  });

  it('reports the total of all matches, not just the page', async () => {
    const { status, body } = await get('q=mug&limit=2&offset=1');
    expect(status).toBe(200);
    expect(body.total).toBe(15);
    expect(body.items.map((p) => p.name)).toEqual(['Mug 2', 'Mug 3']);
  });

  it('caps a large limit at the maximum page size', async () => {
    const { status, body } = await get('limit=1000');
    expect(status).toBe(200);
    expect(body.items).toHaveLength(MAX_LIMIT);
    expect(body.total).toBe(PRODUCTS.length);
  });

  it('returns no items for an offset past the last match', async () => {
    const { status, body } = await get(`offset=${PRODUCTS.length}`);
    expect(status).toBe(200);
    expect(body).toEqual({ total: PRODUCTS.length, items: [] });
  });
});

describe('GET /products validation', () => {
  it("refuses a limit that isn't a whole number with 400", async () => {
    for (const value of ['abc', '2.5', '-1']) {
      const { status } = await get(`limit=${encodeURIComponent(value)}`);
      expect(status, `limit=${value}`).toBe(400);
    }
  });

  it('refuses a limit of 0 with 400', async () => {
    const { status } = await get('limit=0');
    expect(status).toBe(400);
  });

  it("refuses an offset that isn't a whole number with 400", async () => {
    for (const value of ['x', '1.5', '-3']) {
      const { status } = await get(`offset=${encodeURIComponent(value)}`);
      expect(status, `offset=${value}`).toBe(400);
    }
  });
});
