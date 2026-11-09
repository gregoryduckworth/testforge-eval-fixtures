import { createApp } from '../../src/app.js';

export async function startServer() {
  const server = createApp();
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://localhost:${server.address().port}`;
  const close = () => new Promise((resolve) => server.close(resolve));
  return { base, close };
}
