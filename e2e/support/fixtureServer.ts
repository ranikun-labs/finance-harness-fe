/// <reference types="node" />
// tsconfig.app.json의 `compilerOptions.types`가 `["vite/client"]`로 제한되어 있어
// (브라우저 대상 src/ 코드가 Node 전역을 실수로 참조하지 않도록) Node 타입이 자동
// 포함되지 않는다. 이 파일은 build-only 테스트 fixture라 Node 내장 모듈이 필요하므로
// 이 파일에만 명시적으로 타입을 끌어온다(devDependency `@types/node` 이미 설치됨,
// 신규 의존성 없음).

import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';

/**
 * 실제 hosting provider와 무관하게(provider-neutral) STEP 6의 SPA fallback 계약
 * (`docs/route-architecture.md` §10)을 그대로 구현한 최소 정적 서버. `vite preview`는
 * 자체 SPA fallback 로직을 갖고 있어 이 계약(특히 "존재하지 않는 asset은 절대
 * index.html로 새지 않는다")을 provider와 동일하게 검증하지 못할 수 있다 — 그래서
 * 이 fixture가 필요하다.
 *
 * 우선순위:
 * 1. 실제 파일이 존재하면 그 파일을 정확한 Content-Type으로 제공.
 * 2. `<path>/index.html`이 존재하면 그것을 제공(trailing slash 포함 — `/ko`와
 *    `/ko/` 모두 `dist/ko/index.html`로 resolve).
 * 3. asset으로 판별된 요청인데 파일이 없으면 404(index.html로 새지 않음).
 * 4. 그 외 `Accept: text/html`인 document 요청만 `dist/index.html`로 fallback.
 * 5. 그 밖은 404.
 *
 * `X-Finance-Harness-Source` 응답 헤더는 **테스트 전용** 진단 정보이며 production
 * 계약이 아니다.
 */

const ASSET_PREFIX = '/assets/';
const KNOWN_STATIC_EXTENSIONS = new Set([
  '.js',
  '.mjs',
  '.css',
  '.woff',
  '.woff2',
  '.ttf',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.webp',
  '.map',
  '.json',
  '.txt',
  '.xml',
]);

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function isAssetLikePath(pathname: string): boolean {
  return pathname.startsWith(ASSET_PREFIX) || KNOWN_STATIC_EXTENSIONS.has(extname(pathname));
}

function acceptsHtmlDocument(acceptHeader: string | undefined): boolean {
  if (!acceptHeader) return false;
  return acceptHeader.includes('text/html');
}

/** path traversal이 불가능하도록 정규화 후 dist 루트 밖으로 못 나가게 검증한다. */
function resolveSafely(distRoot: string, requestPath: string): string | null {
  const normalized = normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
  const resolved = resolve(distRoot, `.${normalized}`);
  if (resolved !== distRoot && !resolved.startsWith(distRoot + sep)) {
    return null;
  }
  return resolved;
}

function fileIfExists(path: string): string | null {
  if (existsSync(path) && statSync(path).isFile()) return path;
  return null;
}

export interface FixtureServerHandle {
  server: Server;
  baseURL: string;
  close: () => Promise<void>;
}

/**
 * `port`를 생략하거나 `0`을 넘기면 OS가 사용 가능한 포트를 자동 할당한다. 병렬
 * Playwright project/worker마다 이 서버를 독립적으로 기동하므로, 고정 포트를
 * 쓰면 워커 간 충돌(EADDRINUSE)이 발생한다 — 항상 자동 할당 포트를 쓴다.
 */
export function startFixtureServer(
  distRoot: string,
  port: number = 0,
): Promise<FixtureServerHandle> {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    handleRequest(distRoot, req, res);
  });

  return new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      const address = server.address();
      const resolvedPort = typeof address === 'object' && address !== null ? address.port : port;
      resolvePromise({
        server,
        baseURL: `http://127.0.0.1:${resolvedPort}`,
        close: () => new Promise((res) => server.close(() => res())),
      });
    });
  });
}

function handleRequest(distRoot: string, req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', 'http://internal');
  const pathname = decodeURIComponent(url.pathname);

  const exactPath = resolveSafely(distRoot, pathname);
  if (exactPath === null) {
    respond(req, res, 400, 'text/plain; charset=utf-8', 'Bad Request', 'invalid-path');
    return;
  }

  // 1) 실제 파일
  const exactFile = fileIfExists(exactPath);
  if (exactFile) {
    serveFile(req, res, exactFile, 'static-file');
    return;
  }

  // 2) <path>/index.html (trailing slash 포함)
  const indexPath = resolveSafely(distRoot, join(pathname, 'index.html'));
  const indexFile = indexPath && fileIfExists(indexPath);
  if (indexFile) {
    serveFile(req, res, indexFile, 'directory-index');
    return;
  }

  // 3) asset인데 없음 → 404 (fallback 금지)
  if (isAssetLikePath(pathname)) {
    respond(req, res, 404, 'text/plain; charset=utf-8', 'Not Found', 'asset-404');
    return;
  }

  // 4) HTML document 요청만 SPA fallback
  if (acceptsHtmlDocument(req.headers.accept)) {
    const shellPath = join(distRoot, 'index.html');
    const shellFile = fileIfExists(shellPath);
    if (shellFile) {
      serveFile(req, res, shellFile, 'spa-fallback');
      return;
    }
  }

  // 5) 그 밖
  respond(req, res, 404, 'text/plain; charset=utf-8', 'Not Found', 'no-match');
}

function serveFile(
  req: IncomingMessage,
  res: ServerResponse,
  filePath: string,
  source: string,
): void {
  const contentType = CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream';
  const body = readFileSync(filePath);
  respond(req, res, 200, contentType, body, source);
}

function respond(
  req: IncomingMessage,
  res: ServerResponse,
  status: number,
  contentType: string,
  body: string | Buffer,
  source: string,
): void {
  res.writeHead(status, {
    'Content-Type': contentType,
    'X-Finance-Harness-Source': source,
  });
  res.end(req.method === 'HEAD' ? undefined : body);
}
