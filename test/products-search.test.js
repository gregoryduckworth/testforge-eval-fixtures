// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9
import { describe, expect, it } from 'vitest';
import { MAX_LIMIT } from '../src/app.js';
import { useServer } from './support/server.js';

const baseUrl = useServer();

/** GET /products with the given query parameters, URL-encoded. */
async function listProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${baseUrl()}/products${query ? `?${query}` : ''}`);
  return { status: response.status, body: await response.json() };
}

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

describe('GET /products search', () => {
  it('matches names containing q in any case', async () => {
    const { status, body } = await listProducts({ q: 'TEA', limit: '50' });

    expect(status).toBe(200);
    expect(body.total).toBe(30);
    const expectedNames = range(1, 15).flatMap((n) => [`Teapot ${n}`, `Tea strainer ${n}`]);
    expect(body.items.map((p) => p.name)).toEqual(expectedNames);
  });

  it('lists every product when q is absent', async () => {
    const { status, body } = await listProducts();

    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.items.map((p) => p.id)).toEqual(range(1, 20));
  });

  it('returns no items and total 0 when nothing matches', async () => {
    const { status, body } = await listProducts({ q: 'bicycle' });

    expect(status).toBe(200);
    expect(body).toEqual({ total: 0, items: [] });
  });
});

describe('GET /products paging', () => {
  it('returns the page selected by limit and offset with the total of all matches', async () => {
    const { status, body } = await listProducts({ q: 'kettle', limit: '5', offset: '10' });

    expect(status).toBe(200);
    expect(body.total).toBe(15);
    expect(body.items.map((p) => p.name)).toEqual(['Kettle 11', 'Kettle 12', 'Kettle 13', 'Kettle 14', 'Kettle 15']);
    expect(body.items.map((p) => p.id)).toEqual([81, 89, 97, 105, 113]);
  });

  it('returns an empty page with the total when offset is past the last match', async () => {
    const { status, body } = await listProducts({ q: 'kettle', offset: '15' });

    expect(status).toBe(200);
    expect(body).toEqual({ total: 15, items: [] });
  });

  it('caps a large limit at 50', async () => {
    const { status, body } = await listProducts({ limit: '1000' });

    expect(MAX_LIMIT).toBe(50);
    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.items.map((p) => p.id)).toEqual(range(1, 50));
  });
});

describe('GET /products validation', () => {
  describe('refuses a limit that is not a whole number with 400', () => {
    it('refuses limit=abc', async () => {
      const { status, body } = await listProducts({ limit: 'abc' });
      expect(status).toBe(400);
      expect(body).toHaveProperty('error');
    });

    it('refuses limit=2.5', async () => {
      const { status, body } = await listProducts({ limit: '2.5' });
      expect(status).toBe(400);
      expect(body).toHaveProperty('error');
    });

    it('refuses limit=-3', async () => {
      const { status, body } = await listProducts({ limit: '-3' });
      expect(status).toBe(400);
      expect(body).toHaveProperty('error');
    });

    it('refuses an empty limit', async () => {
      const { status, body } = await listProducts({ limit: '' });
      expect(status).toBe(400);
      expect(body).toHaveProperty('error');
    });
  });

  describe('refuses an offset that is not a whole number with 400', () => {
    it('refuses offset=abc', async () => {
      const { status, body } = await listProducts({ offset: 'abc' });
      expect(status).toBe(400);
      expect(body).toHaveProperty('error');
    });

    it('refuses offset=1.5', async () => {
      const { status, body } = await listProducts({ offset: '1.5' });
      expect(status).toBe(400);
      expect(body).toHaveProperty('error');
    });

    it('refuses offset=-1', async () => {
      const { status, body } = await listProducts({ offset: '-1' });
      expect(status).toBe(400);
      expect(body).toHaveProperty('error');
    });
  });

  describe('refuses a limit of 0 with 400 and accepts a limit of 1', () => {
    it('refuses a limit of 0', async () => {
      const { status, body } = await listProducts({ limit: '0' });
      expect(status).toBe(400);
      expect(body).toHaveProperty('error');
    });

    it('accepts a limit of 1', async () => {
      const { status, body } = await listProducts({ limit: '1' });

      expect(status).toBe(200);
      expect(body.items.map((p) => p.id)).toEqual([1]);
    });
  });
});
