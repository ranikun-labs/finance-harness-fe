import { defineConfig } from '@playwright/test';

// Production-mode DEV acceptance build served by vite preview. Requests under /api are answered by
// the DEV edge Worker code through route interception (e2e-same-origin/), with a mock Gateway.
const port = 4175;

export default defineConfig({
  testDir: './e2e-same-origin',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'line',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `pnpm build:dev-acceptance && pnpm exec vite preview --outDir dist-dev-acceptance --host 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'desktop-1440',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } },
    },
  ],
});
