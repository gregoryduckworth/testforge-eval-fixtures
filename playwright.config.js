import { defineConfig, devices } from '@playwright/test';

// A port no repo script uses (npm start serves on 4173), so a running dev server is never reused.
const port = Number(process.env.PLAYWRIGHT_PORT ?? 4183);
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
