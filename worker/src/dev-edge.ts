// Same-origin edge for the Finance DEV acceptance frontend (docs/adr/0001-same-origin-dev-worker.md).
// The browser talks only to this origin. Known Finance API routes are forwarded to the shared
// Gateway; everything else is served from the built SPA assets.
// Nothing here logs request or response content: tokens and passwords never leave memory.

export interface DevEdgeEnv {
  /** Exact HTTPS origin of the shared Gateway, no path (set per environment). */
  GATEWAY_ORIGIN?: string;
  /** Exact origin the browser sees for this Worker (set per environment). */
  PUBLIC_ORIGIN?: string;
  /** Upstream timeout in milliseconds: a whole number from 1 to 60000. Unset means 10000. */
  UPSTREAM_TIMEOUT_MS?: string;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
}

export type UpstreamFetch = (url: string, init: RequestInit) => Promise<Response>;

const FINANCE_NAMESPACE = '/api/finance';
const JOURNALS_PATH = '/api/finance/journals';
const DELETED_PATH = '/api/finance/journals/deleted';
const SIGNUP_PATH = '/api/v1/auth/finance-reference/signup';
const LOGIN_PATH = '/api/v1/auth/finance-reference/login';
// The complete reference-auth route set the FE calls (src/features/auth). All are POST.
const AUTH_POST_PATHS: ReadonlySet<string> = new Set([LOGIN_PATH, SIGNUP_PATH]);
const UUID_SEGMENT = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const JOURNAL_DETAIL = new RegExp(`^${JOURNALS_PATH}/${UUID_SEGMENT}$`);
const JOURNAL_LIFECYCLE = new RegExp(`^${JOURNALS_PATH}/${UUID_SEGMENT}/(delete|restore)$`);
// Forwarded Finance routes and the methods each one accepts. Anything else under /api/finance is 404.
const FINANCE_ROUTE_METHODS: ReadonlyArray<
  readonly [test: (path: string) => boolean, methods: readonly string[]]
> = [
  [(path) => path === JOURNALS_PATH, ['GET', 'POST']],
  [(path) => path === DELETED_PATH, ['GET']],
  [(path) => JOURNAL_DETAIL.test(path), ['GET', 'PATCH']],
  [(path) => JOURNAL_LIFECYCLE.test(path), ['POST']],
];
// Allowlists: anything not listed here (cookies, X-Finance-*, X-User-*, X-Forwarded-*, hop-by-hop
// headers, client-supplied X-Forwarded-For) is dropped in both directions.
// idempotency-key is required by journal create (HttpJournalCreatePort sends it).
const FORWARDED_REQUEST_HEADERS = [
  'accept',
  'accept-language',
  'authorization',
  'content-type',
  'idempotency-key',
] as const;
const FORWARDED_RESPONSE_HEADERS = ['content-type', 'retry-after', 'www-authenticate'] as const;
const DEFAULT_UPSTREAM_TIMEOUT_MS = 10_000;
const MAX_UPSTREAM_TIMEOUT_MS = 60_000;
const MAX_REQUEST_BODY_BYTES = 64 * 1024;

export class DevEdgeConfigError extends Error {}

/** Canonical API namespace. Matching is exact and case-sensitive, like the Gateway. */
export function isApiPath(pathname: string): boolean {
  return pathname === '/api' || pathname.startsWith('/api/');
}

/** Any casing of the API namespace. These are answered by the edge, never by assets. */
function isApiNamespace(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  return lower === '/api' || lower.startsWith('/api/');
}

function isAuthPath(pathname: string): boolean {
  return pathname === '/api/v1/auth' || pathname.startsWith('/api/v1/auth/');
}

function isFinancePath(pathname: string): boolean {
  return pathname === FINANCE_NAMESPACE || pathname.startsWith(`${FINANCE_NAMESPACE}/`);
}

/** Accepts an exact origin: HTTPS, or HTTP only for a loopback host. No path, query, or credentials. */
export function parseExactOrigin(value: string | undefined, label: string): string {
  if (!value || !value.trim()) throw new DevEdgeConfigError(`${label} is not set.`);
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new DevEdgeConfigError(`${label} is not a URL.`);
  }
  const loopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) {
    throw new DevEdgeConfigError(`${label} must be HTTPS.`);
  }
  if (url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw new DevEdgeConfigError(`${label} must be an origin without path or credentials.`);
  }
  return url.origin;
}

export function parseUpstreamTimeout(value: string | undefined): number {
  if (value === undefined || value.trim() === '') return DEFAULT_UPSTREAM_TIMEOUT_MS;
  const trimmed = value.trim();
  const ms = Number(trimmed);
  if (!/^\d+$/.test(trimmed) || ms < 1 || ms > MAX_UPSTREAM_TIMEOUT_MS) {
    throw new DevEdgeConfigError(
      `UPSTREAM_TIMEOUT_MS must be a whole number from 1 to ${MAX_UPSTREAM_TIMEOUT_MS}.`,
    );
  }
  return ms;
}

/**
 * The path portion of the raw request URL string, taken before URL normalization.
 * `new URL()` and `new Request()` already resolve `..` and turn `\` into `/`, so the
 * forbidden-sequence check has to read the string as the client sent it.
 */
export function rawPathOf(rawUrl: string): string {
  const match = /^[a-z][a-z0-9+.-]*:\/\/[^/?#]*([^?#]*)/i.exec(rawUrl);
  return match?.[1] ?? '';
}

function isUnreservedByte(code: number): boolean {
  return (
    (code >= 0x30 && code <= 0x39) || // 0-9
    (code >= 0x41 && code <= 0x5a) || // A-Z
    (code >= 0x61 && code <= 0x7a) || // a-z
    code === 0x2d || // -
    code === 0x2e || // .
    code === 0x5f || // _
    code === 0x7e // ~
  );
}

/**
 * True when the raw path must be rejected: encoded slash, backslash or dot, `;`, `\`,
 * an empty `//` segment, a `..` segment, or a percent-encoded unreserved character.
 * The last rule also closes `%61pi` style spellings of `/api/*` that the Gateway
 * might decode while the edge's exact-path checks would not see them.
 */
export function isForbiddenRawPath(rawPath: string): boolean {
  if (/%2f|%5c|%2e|;|\\|\/\//i.test(rawPath)) return true;
  if (rawPath.split('/').includes('..')) return true;
  for (const match of rawPath.matchAll(/%([0-9a-f]{2})/gi)) {
    if (isUnreservedByte(Number.parseInt(match[1] ?? '', 16))) return true;
  }
  return false;
}

function jsonResponse(status: number, message: string, headers: HeadersInit = {}): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set('content-type', 'application/json; charset=utf-8');
  responseHeaders.set('cache-control', 'no-store');
  responseHeaders.set('x-content-type-options', 'nosniff');
  return new Response(JSON.stringify({ status, message }), { status, headers: responseHeaders });
}

function messageForStatus(status: number): string {
  if (status === 401) return 'Unauthorized.';
  if (status === 403) return 'Forbidden.';
  if (status === 404) return 'Not found.';
  if (status === 409) return 'Conflict.';
  if (status === 429) return 'Too many requests.';
  if (status >= 500) return 'The Finance API is unavailable.';
  return 'The Finance API request failed.';
}

function isJsonContentType(value: string): boolean {
  return /^application\/json(\s*;|$)/i.test(value.trim());
}

function isTimeoutError(error: unknown): boolean {
  return (error as { name?: unknown } | null)?.name === 'TimeoutError';
}

/**
 * Reads the request body up to `maxBytes`. The declared Content-Length is checked first;
 * the stream is then counted so a chunked body without a length is capped too.
 */
async function readRequestBody(
  request: Request,
  maxBytes: number,
): Promise<ArrayBuffer | 'too-large' | 'unreadable'> {
  const declared = request.headers.get('content-length');
  if (declared !== null && Number(declared) > maxBytes) return 'too-large';
  if (!request.body) return new ArrayBuffer(0);

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        void reader.cancel().catch(() => undefined);
        return 'too-large';
      }
      chunks.push(value);
    }
  } catch {
    return 'unreadable';
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes.buffer;
}

function toEdgeResponse(upstream: Response): Response {
  const status = upstream.status;
  if (status >= 300 && status < 400) {
    // The FE never follows redirects. Do not expose the upstream Location either.
    void upstream.body?.cancel();
    return jsonResponse(502, 'The Finance API returned an unexpected redirect.');
  }
  const headers = new Headers({
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  if (status === 204 || status === 205) {
    void upstream.body?.cancel();
    return new Response(null, { status, headers });
  }
  const contentType = upstream.headers.get('content-type') ?? '';
  if (!isJsonContentType(contentType)) {
    // Proxies and tunnels answer with HTML error pages. Replace them so the FE API
    // client always receives the JSON status it expects, never an SPA or proxy page.
    void upstream.body?.cancel();
    return jsonResponse(status, messageForStatus(status));
  }
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  return new Response(upstream.body, { status, headers });
}

/** Returns the allowed methods for a Finance path, or null when the path is not a known route. */
function financeRouteMethods(pathname: string): readonly string[] | null {
  for (const [test, methods] of FINANCE_ROUTE_METHODS) {
    if (test(pathname)) return methods;
  }
  return null;
}

/**
 * Routes one request. `upstreamFetch` is injectable so tests and the Playwright
 * mock Gateway can stand in for the real Gateway.
 */
export async function handleDevEdgeRequest(
  request: Request,
  env: DevEdgeEnv,
  upstreamFetch: UpstreamFetch = (url, init) => fetch(url, init),
): Promise<Response> {
  // Checked on the raw string, before any URL normalization, for every path.
  if (isForbiddenRawPath(rawPathOf(request.url))) {
    return jsonResponse(400, 'Invalid request path.');
  }

  const url = new URL(request.url);
  if (!isApiNamespace(url.pathname)) {
    if (!env.ASSETS) return jsonResponse(404, messageForStatus(404));
    return env.ASSETS.fetch(request);
  }
  // `/API/...` and other casings are API paths. They never reach the SPA fallback and
  // never reach the Gateway, whose routes are case-sensitive.
  if (!isApiPath(url.pathname)) return jsonResponse(404, messageForStatus(404));

  // Unknown /api paths are a JSON 404 here, never the SPA and never the Gateway.
  const isAuth = isAuthPath(url.pathname);
  if (!isAuth && !isFinancePath(url.pathname)) {
    return jsonResponse(404, messageForStatus(404));
  }

  let gatewayOrigin: string;
  let publicOrigin: string;
  let timeoutMs: number;
  try {
    gatewayOrigin = parseExactOrigin(env.GATEWAY_ORIGIN, 'GATEWAY_ORIGIN');
    publicOrigin = parseExactOrigin(env.PUBLIC_ORIGIN, 'PUBLIC_ORIGIN');
    timeoutMs = parseUpstreamTimeout(env.UPSTREAM_TIMEOUT_MS);
  } catch {
    // Fail closed without naming the setting values in the response.
    return jsonResponse(500, 'The DEV edge is not configured.');
  }

  if (isAuth) {
    if (!(request.method === 'POST' && AUTH_POST_PATHS.has(url.pathname))) {
      return jsonResponse(405, 'Method not allowed.', { allow: 'POST' });
    }
  } else {
    const methods = financeRouteMethods(url.pathname);
    if (methods === null) return jsonResponse(404, messageForStatus(404));
    if (!methods.includes(request.method)) {
      return jsonResponse(405, 'Method not allowed.', { allow: methods.join(', ') });
    }
  }

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  // The Worker's own address is the only client address the Gateway should trust.
  const clientAddress = request.headers.get('cf-connecting-ip');
  if (clientAddress) headers.set('x-forwarded-for', clientAddress);
  // The reference signup is a browser POST. Send the exact public origin, like the Carelog registration path.
  if (url.pathname === SIGNUP_PATH) headers.set('origin', publicOrigin);

  const read = await readRequestBody(request, MAX_REQUEST_BODY_BYTES);
  if (read === 'too-large') return jsonResponse(413, 'Request body is too large.');
  if (read === 'unreadable') return jsonResponse(400, 'The request body could not be read.');
  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : read;

  let upstream: Response;
  try {
    upstream = await upstreamFetch(`${gatewayOrigin}${url.pathname}${url.search}`, {
      method: request.method,
      headers,
      redirect: 'manual',
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (isTimeoutError(error)) {
      return jsonResponse(504, 'The Finance API did not respond in time.');
    }
    return jsonResponse(502, 'The Finance API is unavailable.');
  }
  return toEdgeResponse(upstream);
}
