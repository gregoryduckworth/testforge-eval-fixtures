const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A client for the records service. Each call takes the network's time, which varies from one
 * call to the next (up to `latencyMs`). Ids are given in the order the calls are made.
 */
export function createRecordsClient({ latencyMs = 10 } = {}) {
  let next = 1;
  const rows = new Map();
  return {
    async save(record) {
      const id = `rec-${next}`;
      next += 1;
      rows.set(id, { ...record });
      await sleep(Math.random() * latencyMs);
      return id;
    },
    async get(id) {
      await sleep(Math.random() * latencyMs);
      return rows.get(id);
    },
  };
}
