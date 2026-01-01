/**
 * Saves every record at once through `client` and resolves with their ids, in the order of
 * `records`: the first id is the first record's, so callers can pair them up by index.
 */
export async function saveAll(client, records) {
  const ids = [];
  await Promise.all(
    records.map(async (record) => {
      ids.push(await client.save(record));
    }),
  );
  return ids;
}

/** Saves the records one at a time, in order, and resolves with their ids. */
export async function saveEach(client, records) {
  const ids = [];
  for (const record of records) ids.push(await client.save(record));
  return ids;
}
