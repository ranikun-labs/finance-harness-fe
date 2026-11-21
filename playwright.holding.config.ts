import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  testMatch: 'holding-local.spec.ts',
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4179',
    browserName: 'chromium',
    launchOptions: process.env.FINANCE_E2E_CHROMIUM
      ? { executablePath: process.env.FINANCE_E2E_CHROMIUM }
      : {},
    locale: 'en-US',
  },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4179 --strictPort',
    url: 'http://127.0.0.1:4179',
    reuseExistingServer: false,
    env: {
      VITE_LOCAL_GENERAL_ANALYSIS: 'true',
      VITE_LOCAL_HOLDING: 'true',
      FINANCE_API_PROXY_TARGET: 'http://127.0.0.1:8099',
    },
  },
});
