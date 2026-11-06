// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11
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
  const query = new URLSearchParams(params).toString();
  return fetch(`${base}/products${query ? `?${query}` : ''}`);
}

const names = (items) => items.map((item) => item.name);

describe('GET /products search and paging', () => {
  it('matches product names regardless of the case of q', async () => {
    const response = await get({ q: 'kETTLE', limit: '50' });
    const body = await response.json();
    const expected = PRODUCTS.filter((p) => p.name.toLowerCase().includes('kettle'));
    expect(response.status).toBe(200);
    expect(body.total).toBe(15);
    expect(body.items).toHaveLength(15);
    expect(names(body.items)).toEqual(Array.from({ length: 15 }, (_, i) => `Kettle ${i + 1}`));
    expect(names(body.items)).toEqual(names(expected));
  });

  it('matches q anywhere in the name, not only at the start', async () => {
    const response = await get({ q: 'pot', limit: '50' });
    const body = await response.json();
    const expected = PRODUCTS.filter((p) => p.name.toLowerCase().includes('pot'));
    expect(response.status).toBe(200);
    expect(body.total).toBe(15);
    expect(body.items.every((item) => /^Teapot \d+$/.test(item.name))).toBe(true);
    expect(names(body.items)).toEqual(names(expected));
  });

  it('lists every product when q is absent', async () => {
    const response = await get({});
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items).toHaveLength(DEFAULT_LIMIT);
    expect(body.items.map((item) => item.id)).toEqual(
      PRODUCTS.slice(0, DEFAULT_LIMIT).map((p) => p.id),
    );
  });

  it('returns no items and a total of 0 when nothing matches q', async () => {
    const response = await get({ q: 'no-such-product' });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 0, items: [] });
  });

  it('returns the page selected by limit and offset with the total of all matches', async () => {
    const response = await get({ limit: '5', offset: '10' });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.items.map((item) => item.id)).toEqual([11, 12, 13, 14, 15]);
  });

  it('pages through search results with total counting all matches', async () => {
    const response = await get({ q: 'mug', limit: '2', offset: '1' });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.total).toBe(15);
    expect(names(body.items)).toEqual(['Mug 2', 'Mug 3']);
  });

  it('caps a limit above the maximum at MAX_LIMIT items', async () => {
    const response = await get({ limit: '1000' });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(MAX_LIMIT).toBe(50);
    expect(body.items).toHaveLength(MAX_LIMIT);
    expect(body.items.map((item) => item.id)).toEqual(
      PRODUCTS.slice(0, MAX_LIMIT).map((p) => p.id),
    );
    expect(body.total).toBe(120);
  });

  it('returns an empty page and the real total when offset is past the last match', async () => {
    const response = await get({ q: 'kettle', offset: '15' });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 15, items: [] });
  });

  it('refuses a limit below 1 with 400 and accepts a limit of 1', async () => {
    const refused = await get({ limit: '0' });
    const refusedBody = await refused.json();
    expect(refused.status).toBe(400);
    expect(typeof refusedBody.error).toBe('string');

    const accepted = await get({ limit: '1' });
    const acceptedBody = await accepted.json();
    expect(accepted.status).toBe(200);
    expect(acceptedBody.items).toHaveLength(1);
  });

  it('refuses a limit that is not a whole number with 400', async () => {
    for (const value of ['1.5', 'abc', '-5', '']) {
      const response = await get({ limit: value });
      const body = await response.json();
      expect(response.status, `limit=${JSON.stringify(value)} status`).toBe(400);
      expect(typeof body.error, `limit=${JSON.stringify(value)} error`).toBe('string');
    }
  });

  it('refuses an offset that is not a whole number with 400', async () => {
    for (const value of ['1.5', 'abc', '-1', '']) {
      const response = await get({ offset: value });
      const body = await response.json();
      expect(response.status, `offset=${JSON.stringify(value)} status`).toBe(400);
      expect(typeof body.error, `offset=${JSON.stringify(value)} error`).toBe('string');
    }
  });
});
