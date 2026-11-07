// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9
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

function get(params) {
  return fetch(`${base}/products?${new URLSearchParams(params)}`);
}

function matching(text) {
  return PRODUCTS.filter((p) => p.name.toLowerCase().includes(text.toLowerCase()));
}

describe('GET /products search and paging', () => {
  it('matches names containing q in any case', async () => {
    const response = await get({ q: 'TEA', limit: String(MAX_LIMIT) });
    const body = await response.json();
    const expected = matching('tea');
    expect(response.status).toBe(200);
    expect(body.total).toBe(30);
    expect(body.total).toBe(expected.length);
    expect(body.items.map((p) => p.id)).toEqual(expected.slice(0, MAX_LIMIT).map((p) => p.id));
    for (const item of body.items) {
      expect(item.name.toLowerCase()).toContain('tea');
    }
  });

  it('returns no products when nothing matches q', async () => {
    const response = await get({ q: 'zzz-no-such-product' });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 0, items: [] });
  });

  it('lists every product when q is absent', async () => {
    const response = await fetch(`${base}/products`);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual(PRODUCTS.slice(0, DEFAULT_LIMIT).map((p) => p.id));
  });

  it('returns the page selected by limit and offset with the total of all matches', async () => {
    const response = await get({ q: 'kettle', limit: '5', offset: '5' });
    const body = await response.json();
    const expected = matching('kettle');
    expect(response.status).toBe(200);
    expect(body.total).toBe(15);
    expect(body.total).toBe(expected.length);
    expect(body.items.map((p) => p.id)).toEqual(expected.slice(5, 10).map((p) => p.id));
  });

  it('caps a limit above the maximum', async () => {
    for (const limit of [MAX_LIMIT + 1, 1000]) {
      const response = await get({ limit: String(limit) });
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.items).toHaveLength(MAX_LIMIT);
      expect(body.total).toBe(120);
    }
  });

  it('returns an empty page when offset is past the last match', async () => {
    const response = await get({ offset: '120' });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 120, items: [] });
  });

  it('refuses a limit that is not a whole number or below 1 with 400', async () => {
    for (const limit of ['0', '-1', '1.5', 'abc', '']) {
      const response = await get({ limit });
      const body = await response.json();
      expect(response.status, `limit=${limit}`).toBe(400);
      expect(typeof body.error, `limit=${limit}`).toBe('string');
    }
  });

  it('refuses an offset that is not a whole number with 400', async () => {
    for (const offset of ['-1', '2.5', 'abc']) {
      const response = await get({ offset });
      const body = await response.json();
      expect(response.status, `offset=${offset}`).toBe(400);
      expect(typeof body.error, `offset=${offset}`).toBe('string');
    }
    expect((await get({ offset: '0' })).status).toBe(200);
  });

  it('accepts a limit of 1', async () => {
    const response = await get({ limit: '1' });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.items.map((p) => p.id)).toEqual([1]);
    expect(body.total).toBe(120);
  });
});
