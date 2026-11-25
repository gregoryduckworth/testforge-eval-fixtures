// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9
import { describe, expect, it } from 'vitest';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../src/app.js';
import { PRODUCTS } from '../src/catalogue.js';
import { useServer } from './support/server.js';

const baseUrl = useServer();

/** GET /products with the given query parameters, URL-encoded. */
function search(params = {}) {
  const query = new URLSearchParams(params).toString();
  return fetch(`${baseUrl()}/products${query ? `?${query}` : ''}`);
}

function matching(text) {
  return PRODUCTS.filter((p) => p.name.toLowerCase().includes(text.toLowerCase()));
}

async function expectRefused(params) {
  // Soft assertions so every refused value is checked and reported, not just the first.
  const response = await search(params);
  expect.soft(response.status, JSON.stringify(params)).toBe(400);
  const body = await response.json();
  expect.soft(typeof body.error, JSON.stringify(params)).toBe('string');
}

describe('GET /products search', () => {
  it('lists every product when q is absent', async () => {
    const response = await search();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.total).toBe(120);
    expect(body.items).toEqual(PRODUCTS.slice(0, DEFAULT_LIMIT));
  });

  it('matches names containing q in any case', async () => {
    const response = await search({ q: 'TEA', limit: '50' });

    expect(response.status).toBe(200);
    const body = await response.json();
    const expected = matching('tea');
    expect(expected).toHaveLength(30);
    const expectedNames = Array.from({ length: 15 }, (_, i) => [`Teapot ${i + 1}`, `Tea strainer ${i + 1}`]).flat();
    expect(expected.map((p) => p.name)).toEqual(expectedNames);
    expect(body.total).toBe(30);
    expect(body.items).toEqual(expected);
  });

  it('returns no items and total 0 when nothing matches', async () => {
    const response = await search({ q: 'nosuchproduct' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 0, items: [] });
  });
});

describe('GET /products paging', () => {
  it('pages through matches with limit and offset while total counts all matches', async () => {
    const response = await search({ q: 'kettle', limit: '4', offset: '4' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(15);
    expect(body.items.map((p) => p.name)).toEqual(['Kettle 5', 'Kettle 6', 'Kettle 7', 'Kettle 8']);
    expect(body.items).toEqual(matching('kettle').slice(4, 8));
  });

  it('caps a large limit at the maximum page size', async () => {
    const response = await search({ limit: '1000' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(MAX_LIMIT).toBe(50);
    expect(body.items).toHaveLength(MAX_LIMIT);
    expect(body.items).toEqual(PRODUCTS.slice(0, MAX_LIMIT));
    expect(body.total).toBe(PRODUCTS.length);
  });

  it('returns an empty page when offset is past the last match', async () => {
    const response = await search({ q: 'mug', offset: '15' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 15, items: [] });
  });
});

describe('GET /products validation', () => {
  it("refuses a limit that isn't a whole number with 400", async () => {
    for (const limit of ['1.5', 'abc', '-5', '10abc']) {
      await expectRefused({ limit });
    }
  });

  it('refuses a limit of 0 with 400', async () => {
    await expectRefused({ limit: '0' });
  });

  it('accepts a limit of 1', async () => {
    const response = await search({ limit: '1' });

    expect(response.status).toBe(200);
    expect((await response.json()).items).toEqual(PRODUCTS.slice(0, 1));
  });

  it("refuses an offset that isn't a whole number with 400", async () => {
    for (const offset of ['2.5', 'abc', '-1']) {
      await expectRefused({ offset });
    }
  });
});
