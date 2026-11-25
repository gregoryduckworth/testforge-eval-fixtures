// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp, DEFAULT_LIMIT, MAX_LIMIT } from '../src/app.js';
import { PRODUCTS } from '../src/catalogue.js';

let server;
let base;

beforeAll(async () => {
  server = createApp();
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

/** GET /products with the given query parameters, URL-encoded. */
function list(params) {
  const query = new URLSearchParams(params).toString();
  return fetch(`${base}/products${query ? `?${query}` : ''}`);
}

describe('GET /products search', () => {
  it('matches q against product names in any case', async () => {
    // A mixed-case term from inside the name, so a prefix-only match would fail.
    const response = await list({ q: 'EaPo' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(15);
    expect(body.items.map((p) => p.name)).toEqual(Array.from({ length: 15 }, (_, i) => `Teapot ${i + 1}`));
    expect(body.items).toEqual(PRODUCTS.filter((p) => p.name.startsWith('Teapot ')));
  });

  it('lists every product when q is absent', async () => {
    const response = await list({});

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(PRODUCTS).toHaveLength(120);
    expect(body.total).toBe(120);
    expect(DEFAULT_LIMIT).toBe(20);
    expect(body.items).toEqual(PRODUCTS.slice(0, DEFAULT_LIMIT));
  });

  it('returns no items and total 0 when nothing matches q', async () => {
    const response = await list({ q: 'zzz-no-such-product' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 0, items: [] });
  });
});

describe('GET /products paging', () => {
  it('returns the page selected by limit and offset with the total of all matches', async () => {
    const all = await list({ limit: '5', offset: '10' });
    expect(all.status).toBe(200);
    const allBody = await all.json();
    expect(allBody.total).toBe(120);
    expect(allBody.items.map((p) => p.id)).toEqual([11, 12, 13, 14, 15]);

    const mugs = await list({ q: 'mug', limit: '2', offset: '3' });
    expect(mugs.status).toBe(200);
    const mugsBody = await mugs.json();
    expect(mugsBody.total).toBe(15);
    expect(mugsBody.items.map((p) => p.name)).toEqual(['Mug 4', 'Mug 5']);
  });

  it('returns an empty page with the total when offset is past the last match', async () => {
    const response = await list({ offset: '120' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 120, items: [] });
  });

  it('caps a limit above the maximum at MAX_LIMIT', async () => {
    const response = await list({ limit: '1000' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(MAX_LIMIT).toBe(50);
    expect(body.items).toEqual(PRODUCTS.slice(0, MAX_LIMIT));
    expect(body.total).toBe(120);
  });
});

describe('GET /products validation', () => {
  it('refuses a limit or offset that is not a whole number with 400', async () => {
    const malformed = [
      { limit: 'abc' },
      { limit: '1.5' },
      { limit: '-1' },
      { limit: '' },
      { offset: 'abc' },
      { offset: '2.5' },
      { offset: '-1' },
    ];

    const results = await Promise.all(malformed.map(async (params) => ({ params, status: (await list(params)).status })));

    expect(results).toEqual(malformed.map((params) => ({ params, status: 400 })));
  });

  it('refuses a limit of 0 with 400', async () => {
    const response = await list({ limit: '0' });

    expect(response.status).toBe(400);
  });

  it('accepts a limit of 1 and an offset of 0', async () => {
    const response = await list({ limit: '1', offset: '0' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.items).toEqual([PRODUCTS[0]]);
    expect(body.items[0].id).toBe(1);
  });
});
