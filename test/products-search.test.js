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

const get = (params) => fetch(`${base}/products?${new URLSearchParams(params)}`);
const matching = (q) => PRODUCTS.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

describe('GET /products search and paging', () => {
  it('matches names containing q in any case', async () => {
    const expected = matching('teapot');
    expect(expected).toHaveLength(15);

    const response = await get({ q: 'tEaPoT', limit: String(MAX_LIMIT) });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: expected.length, items: expected });

    const middle = matching('frother');
    expect(middle).toHaveLength(15);

    const middleResponse = await get({ q: 'FrOtHeR', limit: String(MAX_LIMIT) });

    expect(middleResponse.status).toBe(200);
    expect(await middleResponse.json()).toEqual({ total: middle.length, items: middle });
  });

  it('lists every product when q is absent', async () => {
    expect(PRODUCTS).toHaveLength(120);

    const response = await fetch(`${base}/products`);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.items).toHaveLength(20);
    expect(body).toEqual({
      total: PRODUCTS.length,
      items: PRODUCTS.slice(0, DEFAULT_LIMIT),
    });
  });

  it('returns no items and a zero total when nothing matches q', async () => {
    const response = await get({ q: 'no such product' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 0, items: [] });
  });

  it('pages through matches with limit and offset and reports the total', async () => {
    const mugs = matching('mug');
    expect(mugs).toHaveLength(15);

    for (const [offset, end] of [
      [0, 4],
      [4, 8],
      [12, 15],
    ]) {
      const response = await get({ q: 'mug', limit: '4', offset: String(offset) });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ total: 15, items: mugs.slice(offset, end) });
    }
  });

  it('caps a large limit at MAX_LIMIT', async () => {
    expect(PRODUCTS.length).toBeGreaterThan(MAX_LIMIT);

    const response = await get({ limit: '1000' });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(MAX_LIMIT).toBe(50);
    expect(body.items).toHaveLength(50);
    expect(body.items).toHaveLength(MAX_LIMIT);
    expect(body).toEqual({ total: 120, items: PRODUCTS.slice(0, MAX_LIMIT) });
  });

  it('returns an empty page with the total when offset is past the last match', async () => {
    const response = await get({ offset: '200' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 120, items: [] });
  });

  it('refuses a limit that is not a whole number with 400', async () => {
    for (const limit of ['1.5', 'abc', '10abc', '-5']) {
      expect([limit, (await get({ limit })).status]).toEqual([limit, 400]);
    }
  });

  it('refuses a limit below 1 with 400', async () => {
    expect((await get({ limit: '0' })).status).toBe(400);
  });

  it('refuses an offset that is not a whole number with 400', async () => {
    for (const offset of ['2.5', 'abc', '-1']) {
      expect([offset, (await get({ offset })).status]).toEqual([offset, 400]);
    }
  });

  it('accepts limit 1 and offset 0', async () => {
    const response = await get({ limit: '1', offset: '0' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 120, items: [PRODUCTS[0]] });
  });
});
