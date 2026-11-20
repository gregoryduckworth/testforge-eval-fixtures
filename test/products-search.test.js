// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11
import { describe, expect, it } from 'vitest';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../src/app.js';
import { PRODUCTS } from '../src/catalogue.js';
import { useServer } from './helpers/server.js';

const baseUrl = useServer();

/** GET /products with the given query parameters, URL-encoded. */
function getProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  return fetch(`${baseUrl()}/products${query ? `?${query}` : ''}`);
}

/** Ids from `from` to `to`, inclusive. */
function ids(from, to) {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

describe('GET /products search', () => {
  it('matches q against product names in any case', async () => {
    // The catalogue holds Teapot 1-15 and Tea strainer 1-15, interleaved by id.
    const expected = ids(1, 15).flatMap((n) => [`Teapot ${n}`, `Tea strainer ${n}`]);

    const response = await getProducts({ q: 'tEA', limit: String(MAX_LIMIT) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(30);
    expect(body.items.map((p) => p.name)).toEqual(expected);
  });

  it('lists every product when q is absent', async () => {
    const response = await getProducts();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual(ids(1, DEFAULT_LIMIT));
  });

  it('returns no items and a total of 0 when nothing matches q', async () => {
    const response = await getProducts({ q: 'no-such-product' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 0, items: [] });
  });
});

describe('GET /products paging', () => {
  it('returns the page that limit and offset select', async () => {
    const response = await getProducts({ limit: '5', offset: '10' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual(ids(11, 15));
  });

  it('gives the total of all matches, not of the page', async () => {
    const response = await getProducts({ q: 'tea', limit: '5', offset: '5' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(30);
    expect(body.items.map((p) => p.name)).toEqual([
      'Tea strainer 3',
      'Teapot 4',
      'Tea strainer 4',
      'Teapot 5',
      'Tea strainer 5',
    ]);
  });

  it('caps a limit above MAX_LIMIT', async () => {
    const response = await getProducts({ limit: '1000' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual(ids(1, MAX_LIMIT));
  });

  it('returns no items for an offset past the last match', async () => {
    const response = await getProducts({ offset: '200' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: PRODUCTS.length, items: [] });
  });
});

describe('GET /products refusals', () => {
  it.each([{ value: 'abc' }, { value: '2.5' }, { value: '-3' }, { value: '' }])(
    'refuses limit=$value with 400',
    async ({ value }) => {
      const response = await getProducts({ limit: value });

      expect(response.status).toBe(400);
      expect(await response.json()).toHaveProperty('error');
    },
  );

  it.each([{ value: 'abc' }, { value: '2.5' }, { value: '-1' }, { value: '' }])(
    'refuses offset=$value with 400',
    async ({ value }) => {
      const response = await getProducts({ offset: value });

      expect(response.status).toBe(400);
      expect(await response.json()).toHaveProperty('error');
    },
  );

  it('refuses limit=0 with 400', async () => {
    const response = await getProducts({ limit: '0' });

    expect(response.status).toBe(400);
    expect(await response.json()).toHaveProperty('error');
  });

  it('accepts limit=1 and returns one product', async () => {
    const response = await getProducts({ limit: '1' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual([1]);
  });
});
