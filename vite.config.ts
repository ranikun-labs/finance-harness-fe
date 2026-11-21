import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { configDefaults, defineConfig } from 'vitest/config';
import { isLocalHoldingPath } from './scripts/local-holding-path';

const financeApiProxyTarget = process.env.FINANCE_API_PROXY_TARGET?.trim();

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const holdingEnabled = env.VITE_LOCAL_HOLDING === 'true';
  const loopbackHosts = ['localhost', '127.0.0.1', '::1'];
  const localHoldingGuard: Plugin = {
    name: 'local-holding-loopback-guard',
    configResolved(config) {
      if (!holdingEnabled || config.command !== 'serve') return;
      if (
        !loopbackHosts.includes(String(config.server.host)) ||
        !loopbackHosts.includes(String(config.preview.host))
      ) {
        throw new Error('Local holding requires explicit loopback Vite and preview hosts');
      }
    },
    configureServer(server) {
      server.middlewares.use(guardRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use(guardRequest);
    },
  };
  function guardRequest(request: IncomingMessage, response: ServerResponse, next: () => void) {
    if (!holdingEnabled) {
      try {
        if (isLocalHoldingPath(request.url ?? '/')) {
          response.statusCode = 404;
          response.end('Not found');
          return;
        }
      } catch {
        response.statusCode = 400;
        response.end('Invalid path');
        return;
      }
    }
    if (!holdingEnabled) {
      next();
      return;
    }
    let hostname = '';
    try {
      hostname = new URL(`http://${request.headers.host ?? ''}`).hostname.replace(/^\[|\]$/g, '');
    } catch {
      /* reject */
    }
    if (
      !loopbackHosts.includes(hostname) ||
      !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.socket.remoteAddress ?? '')
    ) {
      response.statusCode = 403;
      response.end('Loopback only');
      return;
    }
    next();
  }

  if (
    holdingEnabled ||
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
    plugins: [localHoldingGuard, react(), tailwindcss()],
    ...(holdingEnabled ? { server: { host: '127.0.0.1' }, preview: { host: '127.0.0.1' } } : {}),
    // Development-only LAN seam. The browser and application code keep the same-origin
    // `/finance/**` contract; the backend origin is supplied by the local environment once the
    // Mac mini target is known. No host or port is invented in the repository.
    ...(financeApiProxyTarget
      ? {
          server: {
            ...(holdingEnabled ? { host: '127.0.0.1' } : {}),
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
            ...(holdingEnabled ? { host: '127.0.0.1' } : {}),
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
