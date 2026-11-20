// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11
import { describe, expect, it } from 'vitest';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../src/app.js';
import { PRODUCTS } from '../src/catalogue.js';
import { useServer } from './helpers/server.js';

const baseUrl = useServer();

function getProducts(query) {
  return fetch(`${baseUrl()}/products?${new URLSearchParams(query)}`);
}

function ids(from, to) {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

describe('GET /products search and paging', () => {
  it('matches products whose name contains q in any case', async () => {
    // 'strainer' only ever appears mid-name ('Tea strainer n'), so a prefix-only search would find nothing.
    const response = await getProducts({ q: 'StRaInEr', limit: '50' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(15);
    expect(body.items).toHaveLength(15);
    for (const item of body.items) expect(item.name).toMatch(/^Tea strainer \d+$/);
    const names = body.items.map((item) => item.name);
    expect(names).toContain('Tea strainer 1');
    expect(names).toContain('Tea strainer 15');
  });

  it('returns no items and a total of 0 when nothing matches q', async () => {
    const response = await getProducts({ q: 'zzz' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 0, items: [] });
  });

  it('lists every product when q is left out', async () => {
    const response = await getProducts({});

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((item) => item.id)).toEqual(ids(1, DEFAULT_LIMIT));
  });

  it('returns the page that limit and offset select', async () => {
    const response = await getProducts({ limit: '5', offset: '10' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.items.map((item) => item.id)).toEqual([11, 12, 13, 14, 15]);
    expect(body.total).toBe(PRODUCTS.length);
  });

  it('gives the total number of matches, not the page size', async () => {
    const response = await getProducts({ q: 'kettle', limit: '2' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.items).toHaveLength(2);
    expect(body.total).toBe(15);
  });

  it('caps a large limit at MAX_LIMIT', async () => {
    const response = await getProducts({ limit: '1000' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(MAX_LIMIT).toBe(50);
    expect(body.items.map((item) => item.id)).toEqual(ids(1, MAX_LIMIT));
    expect(body.total).toBe(PRODUCTS.length);
  });

  it('returns no items but the full total when offset is past the last match', async () => {
    const response = await getProducts({ offset: '500' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: PRODUCTS.length, items: [] });
  });

  it.each([{ value: 'abc' }, { value: '2.5' }, { value: '-3' }, { value: '' }])(
    "refuses a limit that isn't a whole number with 400 (limit=$value)",
    async ({ value }) => {
      const response = await getProducts({ limit: value });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: expect.any(String) });
    },
  );

  it('refuses limit=0 with 400', async () => {
    const response = await getProducts({ limit: '0' });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: expect.any(String) });
  });

  it('accepts limit=1 and returns one item', async () => {
    const response = await getProducts({ limit: '1' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.items.map((item) => item.id)).toEqual([1]);
    expect(body.total).toBe(PRODUCTS.length);
  });

  it.each([{ value: 'abc' }, { value: '2.5' }, { value: '-1' }])(
    "refuses an offset that isn't a whole number with 400 (offset=$value)",
    async ({ value }) => {
      const response = await getProducts({ offset: value });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: expect.any(String) });
    },
  );
});
