// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../src/app.js';
import { startApp, stopApp } from './helpers/server.js';

let server;
let base;

beforeAll(async () => {
  ({ server, base } = await startApp());
});

afterAll(() => stopApp(server));

/** GET /products with the given query parameters, URL-encoded. */
function listProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  return fetch(`${base}/products${query ? `?${query}` : ''}`);
}

/** Ids from `first` to `last`, inclusive, stepping by `step`. */
function idRange(first, last, step = 1) {
  return Array.from({ length: Math.floor((last - first) / step) + 1 }, (_, i) => first + i * step);
}

describe('GET /products search and paging', () => {
  it('matches q anywhere in the name in any case', async () => {
    // "POT" occurs only mid-name ("Teapot n"), so a prefix or case-sensitive match finds nothing.
    const response = await listProducts({ q: 'POT', limit: '50' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(15);
    // Teapot n has id 8n-5: every eighth id from 3.
    expect(body.items.map((p) => p.id)).toEqual(idRange(3, 115, 8));
    expect(body.items.slice(0, 3).map((p) => p.name)).toEqual(['Teapot 1', 'Teapot 2', 'Teapot 3']);
  });

  it('returns no items and a total of 0 when nothing matches', async () => {
    const response = await listProducts({ q: 'zzz-no-such-product' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 0, items: [] });
  });

  it('lists every product a default page at a time without q', async () => {
    const response = await listProducts();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(120);
    expect(body.items.map((p) => p.id)).toEqual(idRange(1, DEFAULT_LIMIT));
  });

  it('returns the requested page of matches with limit and offset', async () => {
    const response = await listProducts({ q: 'mug', limit: '5', offset: '5' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(15);
    expect(body.items.map((p) => p.name)).toEqual(['Mug 6', 'Mug 7', 'Mug 8', 'Mug 9', 'Mug 10']);
    expect(body.items.map((p) => p.id)).toEqual([44, 52, 60, 68, 76]);
  });

  it('returns an empty page with the total when offset is past the last match', async () => {
    const response = await listProducts({ q: 'mug', offset: '15' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 15, items: [] });
  });

  // The cap is 50 (confirmed for this ticket; the README's "up to 100" is out of date).
  describe('caps limits above 50 at 50 items', () => {
    it('the cap is 50', () => {
      expect(MAX_LIMIT).toBe(50);
    });

    it.each([{ limit: String(MAX_LIMIT + 1) }, { limit: '1000' }])('limit=$limit', async ({ limit }) => {
      const response = await listProducts({ limit });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.total).toBe(120);
      expect(body.items.map((p) => p.id)).toEqual(idRange(1, MAX_LIMIT));
    });
  });

  it('accepts a limit of 1', async () => {
    const response = await listProducts({ limit: '1', offset: '0' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(120);
    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toMatchObject({ id: 1, name: 'Kettle 1' });
  });

  describe("refuses a limit or offset that isn't a whole number with 400", () => {
    it.each([
      { name: 'limit', value: 'abc' },
      { name: 'limit', value: '2.5' },
      { name: 'limit', value: '-1' },
      { name: 'limit', value: '' },
      { name: 'offset', value: 'abc' },
      { name: 'offset', value: '1.5' },
      { name: 'offset', value: '-1' },
    ])('$name=$value', async ({ name, value }) => {
      const response = await listProducts({ [name]: value });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(typeof body.error).toBe('string');
      expect(body).not.toHaveProperty('items');
    });
  });

  it('refuses a limit of 0 with 400', async () => {
    const response = await listProducts({ limit: '0' });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(typeof body.error).toBe('string');
    expect(body).not.toHaveProperty('items');
  });
});
