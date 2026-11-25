import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import type { ProxyOptions } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';

import { resolveFinanceApiBase } from './src/features/finance-api/financeApiBasePolicy';

const financeApiProxyTarget = process.env.FINANCE_API_PROXY_TARGET?.trim();
// Optional DEV seam for the reference-login/signup endpoints (/api/v1/auth/finance-reference/*).
const financeAuthProxyTarget = process.env.FINANCE_AUTH_PROXY_TARGET?.trim();

function buildFinanceProxy(): Record<string, ProxyOptions> {
  const proxy: Record<string, ProxyOptions> = {};
  const shared = { changeOrigin: false, secure: false };
  if (financeApiProxyTarget) {
    // Legacy same-origin contract (production shape) and the DEV `VITE_FINANCE_API_BASE=/api/finance`
    // path, rewritten onto the same backend `/finance/**` routes.
    proxy['/finance'] = { target: financeApiProxyTarget, ...shared };
    proxy['/api/finance'] = {
      target: financeApiProxyTarget,
      ...shared,
      rewrite: (requestPath) => requestPath.replace(/^\/api\/finance/, '/finance'),
    };
  }
  if (financeAuthProxyTarget) {
    proxy['/api/v1/auth/finance-reference'] = { target: financeAuthProxyTarget, ...shared };
  }
  return proxy;
}

const financeProxy = buildFinanceProxy();

export default defineConfig(({ mode }) => {
  // Fail the build (not the browser) when VITE_FINANCE_API_BASE is not a same-origin path.
  // loadEnv merges .env files with process.env, so the check sees the value Vite will inline.
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  resolveFinanceApiBase(env.VITE_FINANCE_API_BASE);

  return {
    plugins: [react(), tailwindcss()],
    // Development-only LAN seam. The browser and application code keep the same-origin contract;
    // backend origins are supplied by the local environment. No host or port is invented here.
    // Used by the local Playwright harness beside `vite preview` as well as `vite` dev.
    ...(Object.keys(financeProxy).length > 0
      ? {
          server: { proxy: financeProxy },
          preview: { proxy: financeProxy },
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
