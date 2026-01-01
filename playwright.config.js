import { defineConfig, devices } from '@playwright/test';

// BASE_URL points the tests at a deployed build; without it they start the shop here.
const deployed = process.env.BASE_URL;
const local = 'http://localhost:4175';

export default defineConfig({
  testDir: './tests',
  use: { baseURL: deployed ?? local },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  ...(deployed
    ? {}
    : {
        webServer: {
          command: 'node src/server.js',
          url: `${local}/health`,
          reuseExistingServer: !process.env.CI,
        },
      }),
});
