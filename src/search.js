import { ordersByCustomer, roundTrip } from './store.js';

/**
 * Search by customer, through a cache in front of the store (a round trip of its own). Entries are
 * shared with other instances and expire at random, so now and then a search misses and rebuilds
 * the customer's index, which takes a lot longer than a hit, and longer still on a bad day.
 */
const MISS_RATE = 0.06;
const rebuildMs = () => 40 - Math.log(1 - Math.random()) * 25;

const cache = new Map();

export async function searchOrders(query) {
  const key = query.toLowerCase();
  if (cache.has(key) && Math.random() >= MISS_RATE) {
    await roundTrip();
    return cache.get(key);
  }
  await new Promise((resolve) => setTimeout(resolve, rebuildMs()));
  cache.set(key, await ordersByCustomer(key));
  return cache.get(key);
}

/** Fills the cache for `queries`, so the first searches after a start aren't all misses. */
export async function warmSearch(queries) {
  for (const query of queries) cache.set(query.toLowerCase(), await ordersByCustomer(query));
}
