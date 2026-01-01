import { describe, expect, it } from 'vitest';
import { saveAll, saveEach } from '../src/bulk.js';
import { createRecordsClient } from '../src/records.js';

describe('saveAll', () => {
  it('resolves with the ids in the order of the records', async () => {
    const client = createRecordsClient();
    const ids = await saveAll(client, [{ name: 'first' }, { name: 'second' }]);
    const saved = await Promise.all(ids.map((id) => client.get(id)));
    expect(saved.map((r) => r.name)).toEqual(['first', 'second']);
  });

  it('saves nothing for no records', async () => {
    await expect(saveAll(createRecordsClient(), [])).resolves.toEqual([]);
  });
});

describe('saveEach', () => {
  it('resolves with the ids in the order of the records', async () => {
    const client = createRecordsClient();
    const ids = await saveEach(client, [{ name: 'first' }, { name: 'second' }]);
    const saved = await Promise.all(ids.map((id) => client.get(id)));
    expect(saved.map((r) => r.name)).toEqual(['first', 'second']);
  });
});
