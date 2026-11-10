import { afterAll, beforeAll } from 'vitest';
import { createApp } from '../../src/app.js';

/**
 * Starts the app on an OS-chosen port for the calling test file and closes it afterwards.
 * Returns a function that gives the base URL once the server is listening.
 */
export function useApp() {
  let server;
  let base;

  beforeAll(async () => {
    server = createApp();
    await new Promise((resolve) => server.listen(0, resolve));
    base = `http://localhost:${server.address().port}`;
  });

  afterAll(() => new Promise((resolve) => server.close(resolve)));

  return () => {
    if (!base) throw new Error('The app is not listening yet');
    return base;
  };
}
