import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/editor-harness.spec.ts', '**/flow-harness.spec.ts'],
  reporter: 'line',
  workers: 1,
  use: {
    baseURL: 'http://localhost:49183',
    locale: 'ko-KR',
    ...(process.env.FINANCE_E2E_CHROMIUM
      ? { launchOptions: { executablePath: process.env.FINANCE_E2E_CHROMIUM } }
      : {}),
  },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --host localhost --port 49183 --strictPort',
    url: 'http://localhost:49183/e2e/support/editor-harness/',
    reuseExistingServer: false,
  },
  projects: [{ name: 'Desktop Chromium', use: { ...devices['Desktop Chrome'] } }],
});
