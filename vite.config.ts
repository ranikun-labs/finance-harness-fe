import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';

const financeApiProxyTarget = process.env.FINANCE_API_PROXY_TARGET?.trim();

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (
    env.VITE_LOCAL_GENERAL_ANALYSIS === 'true' ||
    env.VITE_LOCAL_GENERAL_ANALYSIS_HTTP_SMOKE === 'true'
  ) {
    let target: URL;
    try {
      target = new URL(financeApiProxyTarget ?? '');
    } catch {
      throw new Error('Local analysis requires a loopback FINANCE_API_PROXY_TARGET');
    }
    if (
      target.protocol !== 'http:' ||
      !['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) ||
      target.username ||
      target.password
    )
      throw new Error('Local analysis requires an HTTP loopback proxy target');
  }
  return {
    plugins: [react(), tailwindcss()],
    // Development-only LAN seam. The browser and application code keep the same-origin
    // `/finance/**` contract; the backend origin is supplied by the local environment once the
    // Mac mini target is known. No host or port is invented in the repository.
    ...(financeApiProxyTarget
      ? {
          server: {
            proxy: {
              '/finance': {
                target: financeApiProxyTarget,
                changeOrigin: false,
                secure: false,
              },
            },
          },
          // Used only by the local Playwright harness, which starts a test API beside preview.
          // Normal preview runs remain same-origin and do not invent a backend target.
          preview: {
            proxy: {
              '/finance': {
                target: financeApiProxyTarget,
                changeOrigin: false,
                secure: false,
              },
            },
          },
        }
      : {}),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      globals: true,
      css: true,
      // e2e/는 Playwright 전용 스펙 — Vitest의 기본 include 패턴(*.spec.ts)에 걸려
      // test.describe()가 Vitest 러너 안에서 실행되며 죽는 것을 방지한다.
      exclude: [...configDefaults.exclude, 'e2e/**'],
    },
  };
});
