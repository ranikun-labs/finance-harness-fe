// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

import {
  handleDevEdgeRequest,
  isForbiddenRawPath,
  parseExactOrigin,
  parseUpstreamTimeout,
  rawPathOf,
  type DevEdgeEnv,
} from './dev-edge';

const PUBLIC = 'https://finance-dev.example.test';
const GATEWAY = 'https://gateway.example.test';
const env: DevEdgeEnv = { GATEWAY_ORIGIN: GATEWAY, PUBLIC_ORIGIN: PUBLIC };
const JOURNAL_ID = '550e8400-e29b-41d4-a716-446655440000';

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function html(status: number, body = '<!doctype html><html><body>SPA</body></html>'): Response {
  return new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

function browser(path: string, init: RequestInit = {}) {
  return new Request(`${PUBLIC}${path}`, init);
}

/**
 * A request whose URL string is kept exactly as written. `new Request()` would already
 * resolve `..` and turn `\` into `/`, which is what the raw-path guard must see first.
 */
function rawRequest(rawUrl: string, method = 'GET'): Request {
  return { url: rawUrl, method, headers: new Headers() } as unknown as Request;
}

function upstreamInit(upstream: ReturnType<typeof vi.fn>, index = 0): RequestInit {
  return (upstream.mock.calls[index] as unknown as [string, RequestInit])[1];
}

function upstreamUrl(upstream: ReturnType<typeof vi.fn>, index = 0): string {
  return (upstream.mock.calls[index] as unknown as [string, RequestInit])[0];
}

describe('DEV same-origin edge routing', () => {
  it('serves non-API paths from assets and never calls the Gateway', async () => {
    const assets = vi.fn(async () => html(200));
    const upstream = vi.fn();
    const response = await handleDevEdgeRequest(
      browser('/app/journal'),
      { ...env, ASSETS: { fetch: assets } },
      upstream,
    );

    expect(response.status).toBe(200);
    expect(assets).toHaveBeenCalledTimes(1);
    expect(upstream).not.toHaveBeenCalled();
  });

  it('never hands an /api path to assets, even an unknown one', async () => {
    const assets = vi.fn(async () => html(200));
    const upstream = vi.fn();
    const response = await handleDevEdgeRequest(
      browser('/api/v1/unknown'),
      { ...env, ASSETS: { fetch: assets } },
      upstream,
    );

    expect(assets).not.toHaveBeenCalled();
    expect(upstream).not.toHaveBeenCalled();
    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toEqual({ status: 404, message: 'Not found.' });
  });

  it('answers any casing of the API namespace with JSON 404 and never calls the Gateway', async () => {
    const assets = vi.fn(async () => html(200));
    const upstream = vi.fn();
    for (const path of ['/API/finance/journals', '/Api/v1/auth/finance-reference/login', '/API']) {
      const response = await handleDevEdgeRequest(
        browser(path),
        { ...env, ASSETS: { fetch: assets } },
        upstream,
      );
      expect(response.status).toBe(404);
      expect(response.headers.get('content-type')).toContain('application/json');
    }
    expect(assets).not.toHaveBeenCalled();
    expect(upstream).not.toHaveBeenCalled();
  });

  it('answers /api/finance paths that are not forwarded routes with JSON 404', async () => {
    const upstream = vi.fn();
    for (const path of [
      '/api/finance',
      '/api/finance/',
      '/api/finance/unknown',
      '/api/finance/journals/not-a-uuid',
      '/api/finance/journals/550e8400-e29b-41d4-a716-446655440000/archive',
      '/api/finance/journals/deleted/extra',
    ]) {
      const response = await handleDevEdgeRequest(browser(path), env, upstream);
      expect(response.status).toBe(404);
    }
    expect(upstream).not.toHaveBeenCalled();
  });

  it('does not forward other product namespaces the FE never calls', async () => {
    const upstream = vi.fn();
    const response = await handleDevEdgeRequest(browser('/api/v1/users/customers'), env, upstream);
    expect(response.status).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
  });
});

describe('DEV same-origin edge raw path guard', () => {
  it.each([
    '/api/finance/journals%2fx',
    '/api/finance/%2Fjournals',
    '/api/finance%5cjournals',
    '/api/%2e%2e/secret',
    '/api/finance/journals;jsessionid=1',
    '/api/finance/journals/..\\x',
    '/api/finance//journals',
    '/api/finance/../journals',
    '/api/%61pi/finance/journals',
  ])('rejects %s with JSON 400 before any routing', async (rawUrl) => {
    const assets = vi.fn(async () => html(200));
    const upstream = vi.fn();
    const response = await handleDevEdgeRequest(
      rawRequest(`${PUBLIC}${rawUrl}`),
      { ...env, ASSETS: { fetch: assets } },
      upstream,
    );

    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toEqual({ status: 400, message: 'Invalid request path.' });
    expect(assets).not.toHaveBeenCalled();
    expect(upstream).not.toHaveBeenCalled();
  });

  it('applies the guard to non-API paths too', async () => {
    const assets = vi.fn(async () => html(200));
    const response = await handleDevEdgeRequest(
      rawRequest(`${PUBLIC}/app/%2e%2e/secret`),
      { ...env, ASSETS: { fetch: assets } },
      vi.fn(),
    );
    expect(response.status).toBe(400);
    expect(assets).not.toHaveBeenCalled();
  });

  it('reads the raw string, so an encoded dot-dot that the URL parser would resolve is caught', () => {
    expect(rawPathOf('https://h.test/api/a/%2e%2e/b')).toBe('/api/a/%2e%2e/b');
    expect(isForbiddenRawPath('/api/a/%2e%2e/b')).toBe(true);
    expect(isForbiddenRawPath('/api/finance/journals')).toBe(false);
    expect(isForbiddenRawPath(`/api/finance/journals/${JOURNAL_ID}`)).toBe(false);
  });
});

describe('DEV same-origin edge auth routes', () => {
  it.each(['/api/v1/auth/finance-reference/login', '/api/v1/auth/finance-reference/signup'])(
    'forwards POST %s to the Gateway',
    async (path) => {
      const upstream = vi.fn(async () => json(200, { status: 200, message: 'ok' }));
      await handleDevEdgeRequest(
        browser(path, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ userId: 'a', password: 'b' }),
        }),
        env,
        upstream,
      );
      expect(upstreamUrl(upstream)).toBe(`${GATEWAY}${path}`);
      expect(upstreamInit(upstream).method).toBe('POST');
    },
  );

  it.each([
    ['GET', '/api/v1/auth/finance-reference/login'],
    ['PUT', '/api/v1/auth/finance-reference/signup'],
    ['DELETE', '/api/v1/auth/finance-reference/login'],
    ['GET', '/api/v1/auth/finance-reference/unknown'],
    ['POST', '/api/v1/auth/finance-reference/unknown'],
    ['POST', '/api/v1/auth/login'],
    ['POST', '/api/v1/auth/finance-reference'],
  ])(
    'answers %s %s with 405 and Allow: POST without reaching the Gateway',
    async (method, path) => {
      const upstream = vi.fn();
      const response = await handleDevEdgeRequest(browser(path, { method }), env, upstream);
      expect(response.status).toBe(405);
      expect(response.headers.get('allow')).toBe('POST');
      expect(upstream).not.toHaveBeenCalled();
    },
  );
});

describe('DEV same-origin edge finance method allowlist', () => {
  it.each([
    ['GET', '/api/finance/journals'],
    ['POST', '/api/finance/journals'],
    ['GET', '/api/finance/journals/deleted'],
    ['GET', `/api/finance/journals/${JOURNAL_ID}`],
    ['PATCH', `/api/finance/journals/${JOURNAL_ID}`],
    ['POST', `/api/finance/journals/${JOURNAL_ID}/delete`],
    ['POST', `/api/finance/journals/${JOURNAL_ID}/restore`],
  ])('forwards %s %s', async (method, path) => {
    const upstream = vi.fn(async () => json(200, { status: 200 }));
    await handleDevEdgeRequest(
      browser(path, {
        method,
        headers: { 'content-type': 'application/json' },
        body: method === 'GET' ? undefined : '{}',
      }),
      env,
      upstream,
    );
    expect(upstreamUrl(upstream)).toBe(`${GATEWAY}${path}`);
  });

  it.each([
    ['PUT', '/api/finance/journals'],
    ['DELETE', '/api/finance/journals'],
    ['POST', '/api/finance/journals/deleted'],
    ['POST', `/api/finance/journals/${JOURNAL_ID}`],
    ['DELETE', `/api/finance/journals/${JOURNAL_ID}`],
    ['GET', `/api/finance/journals/${JOURNAL_ID}/delete`],
    ['GET', `/api/finance/journals/${JOURNAL_ID}/restore`],
  ])('answers %s %s with 405 and an Allow header', async (method, path) => {
    const upstream = vi.fn();
    const response = await handleDevEdgeRequest(browser(path, { method }), env, upstream);
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBeTruthy();
    expect(upstream).not.toHaveBeenCalled();
  });
});

describe('DEV same-origin edge API proxy', () => {
  it('forwards method, path, query, body and bearer to the Gateway and returns the JSON envelope', async () => {
    const upstream = vi.fn(async () =>
      json(200, { status: 200, message: 'ok', data: { accessToken: 'a' } }),
    );
    const response = await handleDevEdgeRequest(
      browser('/api/finance/journals?limit=20', {
        method: 'GET',
        headers: { authorization: 'Bearer a-token', accept: 'application/json' },
      }),
      env,
      upstream,
    );

    expect(upstreamUrl(upstream)).toBe(`${GATEWAY}/api/finance/journals?limit=20`);
    const init = upstreamInit(upstream);
    expect(init.redirect).toBe('manual');
    expect((init.headers as Headers).get('authorization')).toBe('Bearer a-token');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toMatchObject({ status: 200, message: 'ok' });
  });

  it('forwards the journal create Idempotency-Key and body', async () => {
    const key = 'create-key-0001';
    const upstream = vi.fn(async () => json(201, { journalId: JOURNAL_ID }));
    const response = await handleDevEdgeRequest(
      browser('/api/finance/journals', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': key },
        body: JSON.stringify({ type: 'investment', assetName: 'A' }),
      }),
      env,
      upstream,
    );

    const headers = upstreamInit(upstream).headers as Headers;
    expect(headers.get('idempotency-key')).toBe(key);
    expect(headers.get('content-type')).toBe('application/json');
    expect(new TextDecoder().decode(upstreamInit(upstream).body as ArrayBuffer)).toBe(
      JSON.stringify({ type: 'investment', assetName: 'A' }),
    );
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ journalId: JOURNAL_ID });
  });

  it('never forwards a client Origin, on signup or login', async () => {
    const upstream = vi.fn(async () => json(201, { status: 201 }));
    await handleDevEdgeRequest(
      browser('/api/v1/auth/finance-reference/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'https://evil.example.test' },
        body: '{}',
      }),
      env,
      upstream,
    );
    expect((upstreamInit(upstream).headers as Headers).has('origin')).toBe(false);

    await handleDevEdgeRequest(
      browser('/api/v1/auth/finance-reference/login', {
        method: 'POST',
        headers: { origin: PUBLIC },
        body: '{}',
      }),
      env,
      upstream,
    );
    expect((upstreamInit(upstream, 1).headers as Headers).has('origin')).toBe(false);
  });

  it('drops cookies, X-Finance-*, X-User-*, X-Forwarded-* and other client headers', async () => {
    const upstream = vi.fn(async () => json(200, { status: 200, data: [] }));
    await handleDevEdgeRequest(
      browser('/api/finance/journals', {
        method: 'GET',
        headers: {
          accept: 'application/json',
          cookie: 'session=abc',
          'x-finance-user-id': 'someone-else',
          'x-user-id': 'admin',
          'x-forwarded-for': '203.0.113.9',
          'x-forwarded-host': 'attacker.example.test',
          'x-custom': 'nope',
          'proxy-authorization': 'Basic eA==',
        },
      }),
      env,
      upstream,
    );

    const headers = upstreamInit(upstream).headers as Headers;
    for (const name of [
      'cookie',
      'x-finance-user-id',
      'x-user-id',
      'x-forwarded-host',
      'x-custom',
      'proxy-authorization',
    ]) {
      expect(headers.has(name)).toBe(false);
    }
    expect(headers.get('accept')).toBe('application/json');
    expect(upstreamInit(upstream).body).toBeUndefined();
  });

  it('overwrites client X-Forwarded-For with cf-connecting-ip', async () => {
    const upstream = vi.fn(async () => json(200, { status: 200 }));
    await handleDevEdgeRequest(
      browser('/api/finance/journals', {
        method: 'GET',
        headers: { 'x-forwarded-for': '198.51.100.1', 'cf-connecting-ip': '203.0.113.7' },
      }),
      env,
      upstream,
    );
    expect((upstreamInit(upstream).headers as Headers).get('x-forwarded-for')).toBe('203.0.113.7');
  });

  it('does not forward x-forwarded-for when cf-connecting-ip is absent', async () => {
    const upstream = vi.fn(async () => json(200, { status: 200 }));
    await handleDevEdgeRequest(
      browser('/api/finance/journals', {
        method: 'GET',
        headers: { 'x-forwarded-for': '198.51.100.1' },
      }),
      env,
      upstream,
    );
    expect((upstreamInit(upstream).headers as Headers).has('x-forwarded-for')).toBe(false);
  });

  it('drops Set-Cookie and Location from upstream responses and forces no-store and nosniff', async () => {
    const upstream = vi.fn(async () =>
      json(
        200,
        { status: 200, data: {} },
        {
          'set-cookie': 'session=stolen; HttpOnly',
          location: 'https://gateway.example.test/elsewhere',
          'x-upstream-debug': 'internal',
          'cache-control': 'public, max-age=3600',
        },
      ),
    );
    const response = await handleDevEdgeRequest(browser('/api/finance/journals'), env, upstream);

    expect(response.headers.get('set-cookie')).toBeNull();
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-upstream-debug')).toBeNull();
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('keeps only allowlisted upstream response headers on JSON success', async () => {
    const upstream = vi.fn(async () =>
      json(429, { status: 429, message: 'slow down' }, { 'retry-after': '30' }),
    );
    const response = await handleDevEdgeRequest(
      browser('/api/v1/auth/finance-reference/login', { method: 'POST', body: '{}' }),
      env,
      upstream,
    );
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('30');
  });

  it('replaces an upstream HTML error page with a JSON envelope at the same status', async () => {
    const upstream = vi.fn(async () => html(503, '<html>Tunnel error</html>'));
    const response = await handleDevEdgeRequest(browser('/api/finance/journals'), env, upstream);
    expect(response.status).toBe(503);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.text()).not.toMatch(/<html|Tunnel/i);
    expect(
      JSON.parse(
        await new Response(
          JSON.stringify({ status: 503, message: 'The Finance API is unavailable.' }),
        ).text(),
      ),
    ).toEqual({
      status: 503,
      message: 'The Finance API is unavailable.',
    });
  });

  it.each([
    [401, 'Unauthorized.'],
    [404, 'Not found.'],
    [409, 'Conflict.'],
    [500, 'The Finance API is unavailable.'],
  ])('turns a non-JSON %i into the matching JSON message', async (status, message) => {
    const upstream = vi.fn(
      async () => new Response('nope', { status, headers: { 'content-type': 'text/plain' } }),
    );
    const response = await handleDevEdgeRequest(browser('/api/finance/journals'), env, upstream);
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ status, message });
  });

  it('answers upstream 3xx with 502 and never exposes the Location', async () => {
    const upstream = vi.fn(
      async () =>
        new Response(null, {
          status: 302,
          headers: { location: 'https://gateway.example.test/login' },
        }),
    );
    const response = await handleDevEdgeRequest(browser('/api/finance/journals'), env, upstream);
    expect(response.status).toBe(502);
    expect(response.headers.get('location')).toBeNull();
    expect(await response.json()).toEqual({
      status: 502,
      message: 'The Finance API returned an unexpected redirect.',
    });
  });

  it('passes 204 through without a body', async () => {
    const upstream = vi.fn(async () => new Response(null, { status: 204 }));
    const response = await handleDevEdgeRequest(
      browser(`/api/finance/journals/${JOURNAL_ID}/delete`, { method: 'POST' }),
      env,
      upstream,
    );
    expect(response.status).toBe(204);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('answers an unreachable upstream with JSON 502', async () => {
    const upstream = vi.fn(async () => {
      throw new TypeError('fetch failed');
    });
    const response = await handleDevEdgeRequest(browser('/api/finance/journals'), env, upstream);
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      status: 502,
      message: 'The Finance API is unavailable.',
    });
  });

  it('answers an upstream timeout with JSON 504', async () => {
    const upstream = vi.fn(async () => {
      throw new DOMException('The operation timed out.', 'TimeoutError');
    });
    const response = await handleDevEdgeRequest(browser('/api/finance/journals'), env, upstream);
    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({
      status: 504,
      message: 'The Finance API did not respond in time.',
    });
  });

  it('passes an abort signal with the configured timeout to the upstream call', async () => {
    const upstream = vi.fn(async () => json(200, { status: 200 }));
    await handleDevEdgeRequest(
      browser('/api/finance/journals'),
      { ...env, UPSTREAM_TIMEOUT_MS: '2500' },
      upstream,
    );
    expect(upstreamInit(upstream).signal).toBeInstanceOf(AbortSignal);
  });
});

describe('DEV same-origin edge body cap', () => {
  it('answers a declared oversize body with 413 before any upstream call', async () => {
    const upstream = vi.fn();
    const response = await handleDevEdgeRequest(
      browser('/api/finance/journals', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'content-length': String(64 * 1024 + 1) },
        body: 'x',
      }),
      env,
      upstream,
    );
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ status: 413, message: 'Request body is too large.' });
    expect(upstream).not.toHaveBeenCalled();
  });

  it('answers a streamed body that exceeds the cap with 413 before any upstream call', async () => {
    const upstream = vi.fn();
    const chunk = new Uint8Array(40 * 1024);
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(chunk);
        controller.enqueue(chunk);
        controller.close();
      },
    });
    const response = await handleDevEdgeRequest(
      browser('/api/finance/journals', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: stream,
        duplex: 'half',
      } as RequestInit),
      env,
      upstream,
    );
    expect(response.status).toBe(413);
    expect(upstream).not.toHaveBeenCalled();
  });

  it('forwards a body exactly at the cap', async () => {
    const upstream = vi.fn(async () => json(201, { journalId: JOURNAL_ID }));
    const body = 'x'.repeat(64 * 1024);
    const response = await handleDevEdgeRequest(
      browser('/api/finance/journals', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      }),
      env,
      upstream,
    );
    expect(response.status).toBe(201);
    expect(upstream).toHaveBeenCalledTimes(1);
  });
});

describe('DEV same-origin edge configuration', () => {
  it.each([
    ['missing GATEWAY_ORIGIN', { PUBLIC_ORIGIN: PUBLIC }],
    ['missing PUBLIC_ORIGIN', { GATEWAY_ORIGIN: GATEWAY }],
    ['gateway with a path', { GATEWAY_ORIGIN: `${GATEWAY}/prefix`, PUBLIC_ORIGIN: PUBLIC }],
    [
      'plain HTTP gateway',
      { GATEWAY_ORIGIN: 'http://gateway.example.test', PUBLIC_ORIGIN: PUBLIC },
    ],
    [
      'public origin with credentials',
      { GATEWAY_ORIGIN: GATEWAY, PUBLIC_ORIGIN: 'https://u:p@x.test' },
    ],
    ['invalid timeout', { ...env, UPSTREAM_TIMEOUT_MS: '0' }],
  ])('fails closed with JSON 500 on %s, without calling the Gateway', async (_label, partial) => {
    const upstream = vi.fn();
    const response = await handleDevEdgeRequest(
      browser('/api/finance/journals'),
      partial as DevEdgeEnv,
      upstream,
    );
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      status: 500,
      message: 'The DEV edge is not configured.',
    });
    expect(upstream).not.toHaveBeenCalled();
  });

  it('accepts loopback HTTP for local runs only', () => {
    expect(parseExactOrigin('http://127.0.0.1:8080', 'X')).toBe('http://127.0.0.1:8080');
    expect(parseExactOrigin('http://localhost', 'X')).toBe('http://localhost');
    expect(() => parseExactOrigin('http://10.0.0.5', 'X')).toThrow();
  });

  it('parses the upstream timeout range', () => {
    expect(parseUpstreamTimeout(undefined)).toBe(10_000);
    expect(parseUpstreamTimeout('60000')).toBe(60_000);
    expect(() => parseUpstreamTimeout('60001')).toThrow();
    expect(() => parseUpstreamTimeout('1.5')).toThrow();
  });
});
