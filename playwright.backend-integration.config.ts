import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'journal-backend.integration.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 90_000,
  use: {
    baseURL: 'http://127.0.0.1:4174',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'Finance backend integration Chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'node e2e/support/journalBackendIntegrationServer.mjs',
    url: 'http://127.0.0.1:4174/e2e/support/journal-backend-harness.html',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
