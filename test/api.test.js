import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

let server;
let base;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://localhost:${server.address().port}`;
});

after(() => server.close());

const get = async (path) => {
  const res = await fetch(`${base}${path}`);
  return { status: res.status, body: await res.json() };
};

describe('orders API', () => {
  it('lists every order with its number of lines', async () => {
    const { status, body } = await get('/orders');
    assert.equal(status, 200);
    assert.equal(body.orders.length, 60);
    assert.equal(body.orders[0].lineCount, 8);
  });

  it("lists each order's total, as the order itself gives it", async () => {
    const { body } = await get('/orders');
    const listed = body.orders.find((o) => o.id === 3);
    assert.equal(listed.totalCents, (await get('/orders/3')).body.totalCents);
  });

  it('returns an order with its lines and total', async () => {
    const { status, body } = await get('/orders/3');
    assert.equal(status, 200);
    assert.equal(body.lines.length, 8);
    assert.ok(body.lines.every((l) => /^Product \d+$/.test(l.productName)));
    assert.equal(
      body.totalCents,
      body.lines.reduce((sum, l) => sum + l.priceCents * l.quantity, 0),
    );
  });

  it('answers 404 for an order that does not exist', async () => {
    assert.equal((await get('/orders/999')).status, 404);
  });

  it('finds orders by customer', async () => {
    const { status, body } = await get('/search?q=grace');
    assert.equal(status, 200);
    assert.ok(body.orders.length > 0);
    assert.ok(body.orders.every((o) => o.customer === 'Grace'));
  });
});
