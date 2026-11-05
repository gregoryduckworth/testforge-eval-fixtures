// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../src/app.js';
import { startApp } from './support/server.js';

let app;
let base;

beforeAll(async () => {
  app = await startApp();
  base = app.base;
});

afterAll(() => app.close());

async function list(query = '') {
  const response = await fetch(`${base}/products${query}`);
  return { status: response.status, body: await response.json() };
}

const names = (body) => body.items.map((p) => p.name);

describe('GET /products search and paging', () => {
  it('matches product names containing q in any case', async () => {
    const { status, body } = await list(`?q=${encodeURIComponent('KeTTLe 1')}&limit=${MAX_LIMIT}`);
    expect(status).toBe(200);
    expect(body.total).toBe(7);
    expect(names(body)).toEqual([
      'Kettle 1',
      'Kettle 10',
      'Kettle 11',
      'Kettle 12',
      'Kettle 13',
      'Kettle 14',
      'Kettle 15',
    ]);
  });

  it('lists every product when q is absent', async () => {
    const { status, body } = await list();
    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.items).toHaveLength(DEFAULT_LIMIT);
    expect(body.items[0].id).toBe(1);
  });

  it('returns no products and a total of 0 when nothing matches q', async () => {
    const { status, body } = await list('?q=bicycle');
    expect(status).toBe(200);
    expect(body).toEqual({ total: 0, items: [] });
  });

  it('returns the page at offset with the total of all matches', async () => {
    const { status, body } = await list('?q=kettle&limit=5&offset=5');
    expect(status).toBe(200);
    expect(body.total).toBe(15);
    expect(names(body)).toEqual(['Kettle 6', 'Kettle 7', 'Kettle 8', 'Kettle 9', 'Kettle 10']);
  });

  it('caps a limit above the maximum at MAX_LIMIT items', async () => {
    const { status, body } = await list('?limit=1000');
    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.items).toHaveLength(MAX_LIMIT);
  });

  it('returns an empty page but the full total when offset is past the last match', async () => {
    const { status, body } = await list('?q=kettle&offset=15');
    expect(status).toBe(200);
    expect(body).toEqual({ total: 15, items: [] });
  });

  it('accepts limit 1 and offset 0 as the smallest valid values', async () => {
    const { status, body } = await list('?limit=1&offset=0');
    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.items.map((p) => p.id)).toEqual([1]);
  });

  it.each(['abc', '2.5', '-1', '0', ''])('refuses a limit that isn\'t a whole number or is below 1 with 400 (limit=%j)', async (limit) => {
    const { status } = await list(`?limit=${encodeURIComponent(limit)}`);
    expect(status).toBe(400);
  });

  it.each(['abc', '1.5', '-1'])('refuses an offset that isn\'t a whole number with 400 (offset=%j)', async (offset) => {
    const { status } = await list(`?offset=${encodeURIComponent(offset)}`);
    expect(status).toBe(400);
  });
});
