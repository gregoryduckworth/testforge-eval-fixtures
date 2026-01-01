# sync

Sends records to the records service: retries with back-off, saves records in bulk, and tells
subscribers what changed.

```bash
npm install
npm test
```

CI runs the tests in a shuffled order (`--sequence.shuffle`), so tests that lean on each other's
leftovers show up.
