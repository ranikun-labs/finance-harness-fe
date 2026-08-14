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
    // 앱(`/app/*`) locale은 저장값이 없으면 navigator.language로 폴백한다
    // (src/i18n/appLocale.ts). 브라우저 컨텍스트 locale을 명시적으로 고정하지
    // 않으면 실행 환경마다 기본 navigator.language가 달라 앱 화면 텍스트가
    // 예측 불가능해진다 — DEFAULT_LOCALE(ko)과 맞춰 결정적으로 고정한다.
    locale: 'ko-KR',
  },
  webServer: {
    // `pnpm`/`npx`가 PATH에 shim으로 없는 환경(예: corepack을 직접 경유하는 설정)에서도
    // 동작하도록 node로 로컬 vite 바이너리를 직접 실행한다.
    command: `node e2e/support/financeE2eServer.mjs`,
    url: `http://localhost:${PORT}`,
    // Finance E2E must own and start its preview. Reusing an unrelated process on the
    // shared port can make a passing test exercise another product; a port conflict
    // should fail closed instead of being masked by an existing server.
    reuseExistingServer: false,
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
