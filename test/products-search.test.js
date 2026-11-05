// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MAX_LIMIT, createApp } from '../src/app.js';

let server;
let base;

beforeAll(async () => {
  server = createApp();
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

async function get(query) {
  const response = await fetch(`${base}/products?${query}`);
  return { status: response.status, body: await response.json() };
}

const names = (items) => items.map((item) => item.name);
const numbered = (name, from, to) =>
  Array.from({ length: to - from + 1 }, (_, i) => `${name} ${from + i}`);

describe('GET /products', () => {
  it('lists every product when q is absent', async () => {
    const { status, body } = await get(`limit=${MAX_LIMIT}`);
    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.items).toHaveLength(MAX_LIMIT);
    expect(body.items[0]).toMatchObject({ id: 1, name: 'Kettle 1' });
  });

  it('matches q anywhere in the name in any case', async () => {
    const { status, body } = await get(`q=${encodeURIComponent('TEA')}&limit=${MAX_LIMIT}`);
    expect(status).toBe(200);
    expect(body.total).toBe(30);
    const expected = [...numbered('Teapot', 1, 15), ...numbered('Tea strainer', 1, 15)];
    expect(names(body.items).sort()).toEqual(expected.sort());
    const ids = body.items.map((item) => item.id);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
  });

  it('returns no items and a total of 0 when nothing matches', async () => {
    const { status, body } = await get('q=blender');
    expect(status).toBe(200);
    expect(body).toEqual({ total: 0, items: [] });
  });

  it('returns the page selected by limit and offset with the total of all matches', async () => {
    const { status, body } = await get('q=kettle&limit=5&offset=5');
    expect(status).toBe(200);
    expect(body.total).toBe(15);
    expect(names(body.items)).toEqual(numbered('Kettle', 6, 10));
  });

  it('caps a large limit at the maximum page size', async () => {
    const { status, body } = await get('limit=1000');
    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.items).toHaveLength(MAX_LIMIT);
    expect(MAX_LIMIT).toBe(50);
  });

  it('returns an empty page with the total when offset is past the last match', async () => {
    const { status, body } = await get('q=kettle&offset=15');
    expect(status).toBe(200);
    expect(body).toEqual({ total: 15, items: [] });
  });

  it("refuses a limit or offset that isn't a whole number, or a limit below 1, with 400", async () => {
    const queries = ['limit=abc', 'limit=2.5', 'limit=0', 'limit=-1', 'offset=abc', 'offset=1.5', 'offset=-1'];
    const results = await Promise.all(queries.map(async (query) => ({ query, ...(await get(query)) })));
    expect(results.map(({ query, status }) => ({ query, status }))).toEqual(
      queries.map((query) => ({ query, status: 400 })),
    );
    for (const { body } of results) expect(body).toHaveProperty('error');
  });

  it('accepts the boundary values limit=1 and offset=0', async () => {
    const { status, body } = await get('limit=1&offset=0');
    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(names(body.items)).toEqual(['Kettle 1']);
  });
});
