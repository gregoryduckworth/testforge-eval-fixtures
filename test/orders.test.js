// GAPS-20261122-1BB3: TC3, TC4, TC5, TC6
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

let server;
let base;

beforeAll(async () => {
  server = createApp();
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

const placeOrder = (body) =>
  fetch(`${base}/orders`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /orders', () => {
  it('places an order', async () => {
    const response = await placeOrder({ productId: 3, quantity: 2 });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: expect.any(Number), status: 'placed' });
  });

  it('refuses a quantity under one', async () => {
    const response = await placeOrder({ productId: 3, quantity: 0 });
    expect(response.status).toBe(400);
  });

  it('is 404 for an unknown product', async () => {
    const response = await placeOrder({ productId: 99, quantity: 1 });
    expect(response.status).toBe(404);
  });

  it('is 409 when the stock is short', async () => {
    const response = await placeOrder({ productId: 4, quantity: 1 });
    expect(response.status).toBe(409);
  });
});

describe('GET /orders/{id}', () => {
  it('returns an order with its total', async () => {
    const { id } = await (await placeOrder({ productId: 1, quantity: 2 })).json();
    const response = await fetch(`${base}/orders/${id}`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id,
      productId: 1,
      quantity: 2,
      status: 'placed',
      total: { amount: 4998, currency: 'USD' },
    });
  });

  it('is 404 for an unknown order', async () => {
    const response = await fetch(`${base}/orders/999`);
    expect(response.status).toBe(404);
  });
});

const placedOrderId = async (body) => {
  const response = await placeOrder(body);
  if (response.status !== 201) {
    throw new Error(`placing ${JSON.stringify(body)}: ${response.status} ${await response.text()}`);
  }
  return (await response.json()).id;
};

const cancelOrder = (id) => fetch(`${base}/orders/${encodeURIComponent(id)}/cancel`, { method: 'POST' });

describe('POST /orders/{id}/cancel', () => {
  it('cancels a placed order', async () => {
    const id = await placedOrderId({ productId: 3, quantity: 2 });
    const response = await cancelOrder(id);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(await response.json()).toEqual({
      id,
      productId: 3,
      quantity: 2,
      status: 'cancelled',
      total: { amount: 1398, currency: 'USD' },
    });
  });

  it('is 404 when cancelling an unknown order', async () => {
    const response = await fetch(`${base}/orders/999/cancel`, { method: 'POST' });
    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(await response.json()).toEqual({ error: expect.any(String) });
  });

  it('is 409 when the order is already cancelled', async () => {
    const id = await placedOrderId({ productId: 3, quantity: 1 });
    const first = await cancelOrder(id);
    if (first.status !== 200) throw new Error(`first cancel of ${id}: ${first.status} ${await first.text()}`);
    const response = await cancelOrder(id);
    expect(response.status).toBe(409);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(await response.json()).toEqual({ error: expect.any(String) });
  });
});
