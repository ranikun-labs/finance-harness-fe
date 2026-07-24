/// <reference types="node" />
// e2e/support/fixtureServer.ts와 동일한 이유(tsconfig.app.json의 types 제한)로
// 이 스펙에서 쓰는 node:path/node:url에 대해서만 Node 타입을 명시적으로 끌어온다.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { request as httpRequest } from 'node:http';
import type { IncomingHttpHeaders } from 'node:http';

import { expect, test } from '@playwright/test';

import { APP_ROUTE_PATHS } from '@/constants/routes';
import { PRERENDER_MANIFEST } from '@/prerender/manifest';
import { PRERENDER_MARKER_ATTRIBUTE, PRERENDER_MARKER_VALUE } from '@/prerender/shouldHydrate';

import type { FixtureServerHandle } from './support/fixtureServer';
import { startFixtureServer } from './support/fixtureServer';

const DIST_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const PRERENDER_MARKER = `${PRERENDER_MARKER_ATTRIBUTE}="${PRERENDER_MARKER_VALUE}"`;

interface RawResponse {
  status: number;
  headers: IncomingHttpHeaders;
  body: string;
}

/**
 * Playwright의 `request`/`fetch`는 malformed `%` 시퀀스를 클라이언트 단에서 사전
 * 인코딩하거나 거부할 수 있어, 서버까지 raw path가 그대로 도달하는지 검증하려면
 * `node:http`로 직접 요청 라인을 구성해야 한다. `http.request`의 `path` 옵션은
 * 별도 인코딩 없이 그대로 전송된다.
 */
function rawGet(baseURL: string, rawPath: string): Promise<RawResponse> {
  const { hostname, port } = new URL(baseURL);
  return new Promise((resolvePromise, reject) => {
    const req = httpRequest({ hostname, port, path: rawPath, method: 'GET' }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        resolvePromise({
          status: res.statusCode ?? 0,
          headers: res.headers,
          body: Buffer.concat(chunks).toString('utf-8'),
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

let fixture: FixtureServerHandle;

test.beforeAll(async () => {
  // 포트 0 = OS 자동 할당. 병렬 project/worker마다 독립 기동되므로 고정 포트를
  // 쓰면 안 된다(EADDRINUSE 방지).
  fixture = await startFixtureServer(DIST_ROOT);
});

test.afterAll(async () => {
  await fixture.close();
});

test.describe('provider-neutral fixture: Pre-render 계약', () => {
  for (const { path: routePath, locale } of PRERENDER_MANIFEST) {
    test(`${routePath} is served from the directory-index (real Pre-render file, not SPA fallback)`, async ({
      request,
    }) => {
      const response = await request.get(`${fixture.baseURL}${routePath}`);
      expect(response.status()).toBe(200);
      expect(response.headers()['x-finance-harness-source']).toBe('directory-index');

      const body = await response.text();
      expect(body).toContain(PRERENDER_MARKER);
      // STEP 7: 각 산출물의 <html lang>은 자신의 locale과 정확히 일치해야 한다 —
      // 빌드 타임 게이트(scripts/verify-prerender-output.mjs)와 별개로 실제 HTTP
      // 응답 기준으로도 재확인한다.
      expect(body).toContain(`<html lang="${locale}">`);
    });
  }

  test('trailing slash resolves to the same directory-index file as without it', async ({
    request,
  }) => {
    const withoutSlash = await request.get(`${fixture.baseURL}/ko`);
    const withSlash = await request.get(`${fixture.baseURL}/ko/`);

    expect(withSlash.headers()['x-finance-harness-source']).toBe('directory-index');
    expect(await withSlash.text()).toBe(await withoutSlash.text());
  });

  const SPA_FALLBACK_PATHS = [
    APP_ROUTE_PATHS.appHome,
    APP_ROUTE_PATHS.ask,
    '/fr',
    '/ko/missing',
    '/ko/learn/unknown-slug',
  ];

  for (const routePath of SPA_FALLBACK_PATHS) {
    test(`${routePath} falls back to the SPA shell (no Pre-render marker)`, async ({ request }) => {
      const response = await request.get(`${fixture.baseURL}${routePath}`, {
        headers: { accept: 'text/html' },
      });
      expect(response.status()).toBe(200);
      expect(response.headers()['x-finance-harness-source']).toBe('spa-fallback');

      const body = await response.text();
      expect(body).not.toContain(PRERENDER_MARKER);
    });
  }

  test('an existing static asset is served as-is (static-file source, correct MIME)', async ({
    request,
  }) => {
    const shellResponse = await request.get(`${fixture.baseURL}/`, {
      headers: { accept: 'text/html' },
    });
    const shellHtml = await shellResponse.text();
    const scriptMatch = shellHtml.match(/src="(\/assets\/[^"]+\.js)"/);
    expect(scriptMatch).not.toBeNull();

    const assetPath = scriptMatch![1];
    const response = await request.get(`${fixture.baseURL}${assetPath}`);
    expect(response.status()).toBe(200);
    expect(response.headers()['x-finance-harness-source']).toBe('static-file');
    expect(response.headers()['content-type']).toContain('javascript');
  });

  test('a missing asset returns a plain 404, never the SPA shell (no MIME confusion)', async ({
    request,
  }) => {
    const response = await request.get(`${fixture.baseURL}/assets/missing.js`);
    expect(response.status()).toBe(404);
    expect(response.headers()['x-finance-harness-source']).toBe('asset-404');
    expect(response.headers()['content-type']).not.toContain('text/html');

    const body = await response.text();
    expect(body).not.toContain('<html');
  });

  test('a missing favicon returns a plain 404 (asset extension, not HTML fallback)', async ({
    request,
  }) => {
    const response = await request.get(`${fixture.baseURL}/favicon.ico`);
    expect(response.status()).toBe(404);
    expect(response.headers()['x-finance-harness-source']).toBe('asset-404');
  });

  test('a non-HTML document request (e.g. JSON API-shaped path) gets a plain 404, not SPA fallback', async ({
    request,
  }) => {
    const response = await request.get(`${fixture.baseURL}/api/example`, {
      headers: { accept: 'application/json' },
    });
    expect(response.status()).toBe(404);
    expect(response.headers()['x-finance-harness-source']).toBe('no-match');
  });

  test('/ (root) is served from the SPA shell, without a Pre-render marker', async ({
    request,
  }) => {
    const response = await request.get(`${fixture.baseURL}/`, {
      headers: { accept: 'text/html' },
    });
    expect(response.status()).toBe(200);
    // "/"는 root가 아니라서가 아니라, dist/index.html이 문자 그대로 "/"의
    // directory-index로 존재하기 때문에 규칙 2(directory-index)로 매칭된다 —
    // rule 4(spa-fallback)가 서빙하는 것과 바이트 단위로 동일한 파일이므로
    // 결과는 같지만, 이 fixture 구현에서는 소스가 directory-index로 보고된다.
    expect(response.headers()['x-finance-harness-source']).toBe('directory-index');
    expect(await response.text()).not.toContain(PRERENDER_MARKER);
  });
});

test.describe('provider-neutral fixture: 브라우저 hydration 검증', () => {
  for (const { path: routePath } of PRERENDER_MANIFEST) {
    test(`${routePath} hydrates without console/page errors and keeps content stable`, async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('pageerror', (err) => pageErrors.push(err.message));

      await page.goto(`${fixture.baseURL}${routePath}`);
      const headingBeforeSettle = await page.locator('h1').first().textContent();

      // React가 hydrate를 마칠 시간을 준다.
      await page.waitForLoadState('networkidle');
      const headingAfterSettle = await page.locator('h1').first().textContent();

      expect(headingAfterSettle).toBe(headingBeforeSettle);
      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(page.url()).toBe(`${fixture.baseURL}${routePath}`);
    });
  }

  test(`${APP_ROUTE_PATHS.appHome} still boots via createRoot (no marker) and renders normally`, async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto(`${fixture.baseURL}${APP_ROUTE_PATHS.appHome}`);
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});

test.describe('provider-neutral fixture: malformed percent-encoding 방어', () => {
  const MALFORMED_PATHS = ['/%', '/%zz', '/%E0%A4'];

  for (const rawPath of MALFORMED_PATHS) {
    test(`GET ${rawPath} returns 400 with invalid-path source, not the SPA shell`, async () => {
      const response = await rawGet(fixture.baseURL, rawPath);

      expect(response.status).toBe(400);
      expect(response.headers['x-finance-harness-source']).toBe('invalid-path');
      expect(response.body).not.toContain(PRERENDER_MARKER);
      expect(response.body).not.toContain('<html');
    });
  }

  test('a malformed request does not crash the server — a subsequent /ko request still succeeds', async () => {
    const malformedResponse = await rawGet(fixture.baseURL, '/%');
    expect(malformedResponse.status).toBe(400);

    const followUpResponse = await rawGet(fixture.baseURL, '/ko');
    expect(followUpResponse.status).toBe(200);
    expect(followUpResponse.headers['x-finance-harness-source']).toBe('directory-index');
  });
});
