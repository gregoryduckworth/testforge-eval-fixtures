// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../src/app.js';
import { PRODUCTS } from '../src/catalogue.js';
import { startServer } from './helpers/server.js';

let server;

beforeAll(async () => {
  server = await startServer();
});

afterAll(() => server?.close());

/** GET /products with the given query parameters, URL-encoded. */
function getProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  return fetch(`${server.base}/products${query ? `?${query}` : ''}`);
}

/** The ids 1..count, in order. */
function idsUpTo(count) {
  return Array.from({ length: count }, (_, i) => i + 1);
}

describe('GET /products search', () => {
  it('matches names containing q in any case', async () => {
    // Teapot and Tea strainer are each numbered 1 to 15 and alternate by id.
    const expectedNames = Array.from({ length: 15 }, (_, i) => [`Teapot ${i + 1}`, `Tea strainer ${i + 1}`]).flat();

    const response = await getProducts({ q: 'tEA', limit: '50' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(30);
    expect(body.items.map((p) => p.name)).toEqual(expectedNames);
  });

  it('lists every product when q is absent', async () => {
    const response = await getProducts();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual(idsUpTo(DEFAULT_LIMIT));
  });

  it('returns no items and a total of 0 when nothing matches q', async () => {
    const response = await getProducts({ q: 'zzz-no-such-product' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 0, items: [] });
  });
});

describe('GET /products paging', () => {
  it('returns the page selected by limit and offset with the total of all matches', async () => {
    const response = await getProducts({ q: 'mug', limit: '5', offset: '5' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(15);
    expect(body.items.map((p) => p.name)).toEqual(['Mug 6', 'Mug 7', 'Mug 8', 'Mug 9', 'Mug 10']);
  });

  it('returns no items but the full total when offset is past the last match', async () => {
    const response = await getProducts({ q: 'mug', offset: '15' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 15, items: [] });
  });

  it('caps a limit above MAX_LIMIT to MAX_LIMIT items', async () => {
    const response = await getProducts({ limit: String(MAX_LIMIT + 1) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual(idsUpTo(MAX_LIMIT));
  });

  it('accepts the smallest limit of 1', async () => {
    const response = await getProducts({ limit: '1' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual([1]);
  });
});

describe('GET /products refusals', () => {
  it('refuses a limit of 0 with 400', async () => {
    const response = await getProducts({ limit: '0' });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: expect.any(String) });
  });

  it.each([{ value: 'abc' }, { value: '2.5' }, { value: '-3' }, { value: '' }])(
    "refuses limit=$value with 400 because it isn't a whole number",
    async ({ value }) => {
      const response = await getProducts({ limit: value });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: expect.any(String) });
    },
  );

  it.each([{ value: 'abc' }, { value: '2.5' }, { value: '-1' }, { value: '' }])(
    "refuses offset=$value with 400 because it isn't a whole number",
    async ({ value }) => {
      const response = await getProducts({ offset: value });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: expect.any(String) });
    },
  );
});
