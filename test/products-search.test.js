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

function list(query) {
  return fetch(`${base}/products?${query}`);
}

describe('GET /products search and paging', () => {
  it('matches q anywhere in the name regardless of case', async () => {
    const response = await list('q=TEA&limit=50');
    const body = await response.json();
    const names = body.items.map((p) => p.name);
    expect(response.status).toBe(200);
    expect(body.total).toBe(30);
    expect(names).toHaveLength(30);
    expect(names.every((n) => n.toLowerCase().includes('tea'))).toBe(true);
    expect(names).toContain('Teapot 1');
    expect(names).toContain('Tea strainer 1');
  });

  it('lists every product when q is absent', async () => {
    const response = await fetch(`${base}/products`);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual(PRODUCTS.slice(0, DEFAULT_LIMIT).map((p) => p.id));
  });

  it('returns no items and a total of 0 when nothing matches q', async () => {
    const response = await list('q=blender');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 0, items: [] });
  });

  it('returns the page selected by limit and offset with the total of all matches', async () => {
    const response = await list('limit=5&offset=10');
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual([11, 12, 13, 14, 15]);
  });

  it('pages through search results with total counting every match', async () => {
    const response = await list('q=mug&limit=5&offset=10');
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.total).toBe(15);
    expect(body.items.map((p) => p.name)).toEqual(['Mug 11', 'Mug 12', 'Mug 13', 'Mug 14', 'Mug 15']);
  });

  it('caps a large limit at the maximum page size', async () => {
    const response = await list('limit=1000');
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.items).toHaveLength(MAX_LIMIT);
    expect(body.total).toBe(PRODUCTS.length);
  });

  it('returns an empty page when offset is past the last match', async () => {
    const response = await list(`offset=${PRODUCTS.length}`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: PRODUCTS.length, items: [] });
  });

  it("refuses a limit that isn't a whole number with 400", async () => {
    for (const value of ['abc', '2.5', '-3']) {
      const response = await list(`limit=${encodeURIComponent(value)}`);
      expect(response.status, `limit=${value}`).toBe(400);
      expect(await response.json()).toHaveProperty('error');
    }
  });

  it('refuses a limit of 0 with 400 and accepts a limit of 1', async () => {
    const refused = await list('limit=0');
    const accepted = await list('limit=1');
    expect(refused.status).toBe(400);
    expect(accepted.status).toBe(200);
    expect((await accepted.json()).items).toHaveLength(1);
  });

  it("refuses an offset that isn't a whole number with 400", async () => {
    for (const value of ['x', '1.5', '-1']) {
      const response = await list(`offset=${encodeURIComponent(value)}`);
      expect(response.status, `offset=${value}`).toBe(400);
      expect(await response.json()).toHaveProperty('error');
    }
  });
});
