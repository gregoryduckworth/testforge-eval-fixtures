import { defineConfig, devices } from '@playwright/test';

// The suite serves the app on its own port (not `npm start`'s 4173), so a running dev server is never reused.
const port = Number(process.env.E2E_PORT ?? 4317);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: './tests',
  use: { baseURL },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node server.js',
    env: { PORT: String(port) },
    url: baseURL,
    reuseExistingServer: false,
  },
});
