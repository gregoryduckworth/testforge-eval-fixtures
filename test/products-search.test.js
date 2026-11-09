// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../src/app.js';
import { startServer } from './support/server.js';

let base;
let close;

beforeAll(async () => {
  ({ base, close } = await startServer());
});

afterAll(() => close());

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

async function get(query) {
  const response = await fetch(`${base}/products${query}`);
  return { status: response.status, body: await response.json() };
}

describe('GET /products', () => {
  it('matches q against product names in any case', async () => {
    const { status, body } = await get('?q=tEA&limit=50');
    expect(status).toBe(200);
    expect(body.total).toBe(30);
    expect(body.items).toHaveLength(30);
    expect(body.items.map((p) => p.name)).toEqual(
      range(1, 15).flatMap((n) => [`Teapot ${n}`, `Tea strainer ${n}`]),
    );
  });

  it('lists every product when q is absent', async () => {
    const { status, body } = await get('');
    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.items.map((p) => p.id)).toEqual(range(1, DEFAULT_LIMIT));
  });

  it('returns no items and a total of 0 when nothing matches q', async () => {
    const { status, body } = await get('?q=bicycle');
    expect(status).toBe(200);
    expect(body).toEqual({ total: 0, items: [] });
  });

  it('returns the page that limit and offset select, with the total of all matches', async () => {
    const { status, body } = await get('?limit=5&offset=10');
    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.items.map((p) => p.id)).toEqual(range(11, 15));
  });

  it('pages through search results with total counting all matches', async () => {
    const { status, body } = await get('?q=mug&limit=3&offset=3');
    expect(status).toBe(200);
    expect(body.total).toBe(15);
    expect(body.items.map((p) => [p.id, p.name])).toEqual([
      [28, 'Mug 4'],
      [36, 'Mug 5'],
      [44, 'Mug 6'],
    ]);
  });

  it('caps a limit above the maximum at MAX_LIMIT items', async () => {
    const { status, body } = await get('?limit=1000');
    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.items).toHaveLength(MAX_LIMIT);
    expect(body.items.map((p) => p.id)).toEqual(range(1, MAX_LIMIT));
  });

  it('returns an empty page when offset is past the last match', async () => {
    const { status, body } = await get('?offset=120');
    expect(status).toBe(200);
    expect(body).toEqual({ total: 120, items: [] });
  });

  it('refuses a limit that is not a whole number with 400', async () => {
    for (const value of ['abc', '2.5', '-3']) {
      const { status } = await get(`?limit=${encodeURIComponent(value)}`);
      expect(status, `limit=${value}`).toBe(400);
    }
  });

  it('refuses a limit of 0 with 400', async () => {
    const { status } = await get('?limit=0');
    expect(status).toBe(400);
  });

  it('refuses an offset that is not a whole number with 400', async () => {
    for (const value of ['abc', '1.5', '-1']) {
      const { status } = await get(`?offset=${encodeURIComponent(value)}`);
      expect(status, `offset=${value}`).toBe(400);
    }
  });
});
