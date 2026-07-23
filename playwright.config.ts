import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  webServer: {
    // `pnpm`/`npx`가 PATH에 shim으로 없는 환경(예: corepack을 직접 경유하는 설정)에서도
    // 동작하도록 node로 로컬 vite 바이너리를 직접 실행한다.
    command: `node node_modules/vite/bin/vite.js preview --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'Desktop Chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile 375',
      use: {
        browserName: 'chromium',
        viewport: { width: 375, height: 812 },
      },
    },
  ],
});
