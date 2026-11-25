// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../src/app.js';
import { PRODUCTS } from '../src/catalogue.js';
import { startApp } from './support/server.js';

let app;
let base;

beforeAll(async () => {
  app = await startApp();
  base = app.base;
});

afterAll(() => app.close());

async function listProducts(params) {
  const query = new URLSearchParams(params).toString();
  return fetch(`${base}/products${query ? `?${query}` : ''}`);
}

describe('GET /products search', () => {
  it('matches q against product names in any case', async () => {
    const response = await listProducts({ q: 'TEA', limit: '50' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(30);
    // By id, the catalogue alternates Teapot N (id 8N-5) and Tea strainer N (id 8N-1).
    const expectedNames = Array.from({ length: 15 }, (_, i) => [`Teapot ${i + 1}`, `Tea strainer ${i + 1}`]).flat();
    expect(body.items.map((p) => p.name)).toEqual(expectedNames);
  });

  it('lists every product when q is absent', async () => {
    const response = await listProducts({});

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.total).toBe(120);
    expect(body.items.map((p) => p.id)).toEqual(Array.from({ length: DEFAULT_LIMIT }, (_, i) => i + 1));
  });

  it('returns no items and a total of 0 when nothing matches', async () => {
    // A matching query first, so the empty result below can't come from an empty catalogue.
    const control = await listProducts({ q: 'kettle', limit: '1' });
    expect((await control.json()).total).toBe(15);

    const response = await listProducts({ q: 'zzz-no-such-product' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 0, items: [] });
  });
});

describe('GET /products paging', () => {
  it('returns the page at offset with limit items and the total of all matches', async () => {
    const response = await listProducts({ q: 'kettle', limit: '5', offset: '5' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(15);
    expect(body.items.map((p) => p.name)).toEqual(['Kettle 6', 'Kettle 7', 'Kettle 8', 'Kettle 9', 'Kettle 10']);
  });

  it('caps a large limit at the maximum page size', async () => {
    const response = await listProducts({ limit: '1000' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(MAX_LIMIT).toBe(50);
    expect(body.total).toBe(120);
    expect(body.items.map((p) => p.id)).toEqual(Array.from({ length: MAX_LIMIT }, (_, i) => i + 1));
  });

  it('returns no items past the last match while still giving the total', async () => {
    const response = await listProducts({ offset: '120' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 120, items: [] });
  });
});

describe('GET /products validation', () => {
  it("refuses a limit that isn't a whole number with 400", async () => {
    for (const limit of ['abc', '1.5', '-1', '']) {
      const response = await listProducts({ limit });
      // Soft, so every accepted value is reported, not only the first.
      expect.soft(response.status, `limit=${JSON.stringify(limit)}`).toBe(400);
    }
  });

  it('refuses a limit of 0 with 400', async () => {
    const response = await listProducts({ limit: '0' });

    expect(response.status).toBe(400);
  });

  it("refuses an offset that isn't a whole number with 400", async () => {
    for (const offset of ['abc', '2.5', '-1']) {
      const response = await listProducts({ offset });
      expect.soft(response.status, `offset=${JSON.stringify(offset)}`).toBe(400);
    }
  });

  it('accepts a limit of 1 and an offset of 0', async () => {
    const response = await listProducts({ limit: '1', offset: '0' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(120);
    expect(body.items.map((p) => p.id)).toEqual([1]);
  });
});
