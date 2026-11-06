// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8
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

function get(params = {}) {
  const query = new URLSearchParams(params).toString();
  return fetch(`${base}/products${query ? `?${query}` : ''}`);
}

function matching(q) {
  return PRODUCTS.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
}

describe('GET /products search and paging', () => {
  it('matches names containing q in any case', async () => {
    const expected = matching('tea');
    expect(expected).toHaveLength(30);

    const response = await get({ q: 'tEA', limit: String(MAX_LIMIT) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(30);
    expect(body.items).toEqual(expected.slice(0, MAX_LIMIT));
  });

  it('lists every product when q is absent', async () => {
    expect(PRODUCTS).toHaveLength(120);

    const response = await get();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items).toEqual(PRODUCTS.slice(0, DEFAULT_LIMIT));
  });

  it('returns the page at offset with the total of all matches', async () => {
    const expected = matching('kettle');
    expect(expected).toHaveLength(15);

    const first = await (await get({ q: 'kettle', limit: '4', offset: '0' })).json();
    const second = await (await get({ q: 'kettle', limit: '4', offset: '4' })).json();

    expect(first.total).toBe(15);
    expect(second.total).toBe(15);
    expect(first.items).toEqual(expected.slice(0, 4));
    expect(second.items).toEqual(expected.slice(4, 8));
    expect(first.items.map((p) => p.name)).toEqual(['Kettle 1', 'Kettle 2', 'Kettle 3', 'Kettle 4']);
    expect(second.items.map((p) => p.name)).toEqual(['Kettle 5', 'Kettle 6', 'Kettle 7', 'Kettle 8']);
  });

  it('returns no items for an offset past the last match', async () => {
    const response = await get({ q: 'kettle', offset: '15' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 15, items: [] });
  });

  it('caps a limit above the maximum', async () => {
    for (const limit of [MAX_LIMIT + 1, 1000]) {
      const response = await get({ limit: String(limit) });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.total).toBe(120);
      expect(body.items).toHaveLength(MAX_LIMIT);
      expect(body.items).toEqual(PRODUCTS.slice(0, MAX_LIMIT));
    }
  });

  it.each([
    { name: 'limit', value: '2.5' },
    { name: 'limit', value: 'abc' },
    { name: 'limit', value: '-3' },
    { name: 'offset', value: '1.5' },
    { name: 'offset', value: 'abc' },
    { name: 'offset', value: '-1' },
  ])('refuses a limit or offset that is not a whole number with 400', async ({ name, value }) => {
    const response = await get({ [name]: value });

    expect(response.status).toBe(400);
  });

  it('refuses a limit of 0 with 400', async () => {
    const response = await get({ limit: '0' });

    expect(response.status).toBe(400);
  });

  it('accepts a limit of 1 and an offset of 0', async () => {
    const response = await get({ limit: '1', offset: '0' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.items).toEqual([PRODUCTS[0]]);
    expect(body.total).toBe(120);
  });
});
