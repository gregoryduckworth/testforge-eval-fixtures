// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7
import { describe, expect, it } from 'vitest';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../src/app.js';
import { useApp } from './helpers/server.js';

const baseUrl = useApp();

async function getProducts(params) {
  const response = await fetch(`${baseUrl()}/products?${new URLSearchParams(params)}`);
  return { status: response.status, body: await response.json() };
}

/** Ids from..to inclusive. */
function idRange(from, to) {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

describe('GET /products', () => {
  it('matches products whose name contains q in any case', async () => {
    const { status, body } = await getProducts({ q: 'kETTLE 1' });

    expect(status).toBe(200);
    expect(body.total).toBe(7);
    expect(body.items.map((p) => p.name)).toEqual([
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
    const { status, body } = await getProducts({});

    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.items.map((p) => p.id)).toEqual(idRange(1, DEFAULT_LIMIT));
    expect(body.items).toHaveLength(20);
  });

  it('returns the page selected by limit and offset with the total of all matches', async () => {
    const { status, body } = await getProducts({ limit: '5', offset: '10' });

    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.items.map((p) => p.id)).toEqual([11, 12, 13, 14, 15]);
  });

  it('caps a large limit at the maximum page size', async () => {
    const { status, body } = await getProducts({ limit: '1000' });

    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.items.map((p) => p.id)).toEqual(idRange(1, MAX_LIMIT));
    // Pins the code's MAX_LIMIT of 50. README.md says "up to 100", which differs from the code.
    expect(body.items).toHaveLength(50);
  });

  it('returns no items but the full total when offset is past the last match', async () => {
    const { status, body } = await getProducts({ q: 'teapot', offset: '15' });

    expect(status).toBe(200);
    expect(body.total).toBe(15);
    expect(body.items).toEqual([]);
  });

  describe('refuses a limit or offset that is not a whole number, or a limit below 1, with 400', () => {
    it.each([
      { name: 'limit', value: 'abc' },
      { name: 'limit', value: '2.5' },
      { name: 'limit', value: '-1' },
      { name: 'limit', value: '0' },
      { name: 'limit', value: '' },
      { name: 'offset', value: 'abc' },
      { name: 'offset', value: '1.5' },
      { name: 'offset', value: '-1' },
    ])('$name=$value', async ({ name, value }) => {
      const { status, body } = await getProducts({ [name]: value });

      expect(status).toBe(400);
      expect(typeof body.error).toBe('string');
    });
  });

  it('accepts the smallest valid limit and offset', async () => {
    const { status, body } = await getProducts({ limit: '1', offset: '0' });

    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.items.map((p) => p.id)).toEqual([1]);
  });
});
