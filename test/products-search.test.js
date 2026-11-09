// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../src/app.js';
import { PRODUCTS } from '../src/catalogue.js';
import { startServer } from './helpers/server.js';

let server;

beforeAll(async () => {
  server = await startServer();
});

afterAll(() => server?.close());

async function list(params) {
  const response = await fetch(`${server.base}/products?${new URLSearchParams(params)}`);
  return response;
}

async function okBody(params) {
  const response = await list(params);
  expect(response.status).toBe(200);
  return response.json();
}

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

describe('GET /products search and paging', () => {
  it('matches names containing q in any case', async () => {
    const body = await okBody({ q: 'eaPO', limit: String(MAX_LIMIT) });
    expect(body.total).toBe(15);
    expect(body.items.map((p) => p.name)).toEqual(range(1, 15).map((n) => `Teapot ${n}`));
  });

  it('lists every product when q is absent', async () => {
    const body = await okBody({});
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual(range(1, DEFAULT_LIMIT));
  });

  it('returns no items and total 0 when nothing matches q', async () => {
    const body = await okBody({ q: 'zzz-no-such-product' });
    expect(body).toEqual({ total: 0, items: [] });
  });

  it('returns the page at offset with the total of all matches', async () => {
    const body = await okBody({ q: 'mug', limit: '5', offset: '5' });
    expect(body.total).toBe(15);
    expect(body.items.map((p) => p.name)).toEqual(range(6, 10).map((n) => `Mug ${n}`));
  });

  it('returns an empty page when offset is past the last match', async () => {
    const body = await okBody({ q: 'mug', offset: '15' });
    expect(body.total).toBe(15);
    expect(body.items).toEqual([]);
  });

  it('caps a large limit at the maximum page size', async () => {
    const body = await okBody({ limit: '1000' });
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual(range(1, MAX_LIMIT));
  });

  it.each(['2.5', 'abc', '-1', '1e2', ''])(
    'refuses a limit that is not a whole number with 400 (limit=%j)',
    async (limit) => {
      const response = await list({ limit });
      expect(response.status).toBe(400);
      expect(typeof (await response.json()).error).toBe('string');
    },
  );

  it.each(['1.5', 'x', '-1', ''])(
    'refuses an offset that is not a whole number with 400 (offset=%j)',
    async (offset) => {
      const response = await list({ offset });
      expect(response.status).toBe(400);
      expect(typeof (await response.json()).error).toBe('string');
    },
  );

  it('refuses limit 0 with 400', async () => {
    const response = await list({ limit: '0' });
    expect(response.status).toBe(400);
    expect(typeof (await response.json()).error).toBe('string');
  });

  it('accepts limit 1 and offset 0', async () => {
    const body = await okBody({ limit: '1', offset: '0' });
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual([1]);
  });
});
