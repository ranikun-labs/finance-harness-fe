import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  FinanceReferenceAuthError,
  FinanceReferenceAuthSession,
  FinanceReferenceSignupPort,
  type FinanceReferenceFetch,
  isFinanceReferenceAuthEnabled,
  isFinanceReferenceSignupEnabled,
  validateFinanceReferenceSignup,
} from '@/features/auth/financeReferenceAuth';

const SIGNUP_URL = '/api/v1/auth/finance-reference/signup';
const VALID = { email: 'Dev.Account@Example.test', password: 'devpass2026' };

function jsonResponse(status: number, body: unknown = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function codeOf(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error instanceof FinanceReferenceAuthError ? error.code : `other:${String(error)}`;
  }
  return 'resolved';
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DEV flags for the reference panel (default OFF, never PROD)', () => {
  it('signup is enabled only with flag true and a non-production build', () => {
    expect(isFinanceReferenceSignupEnabled(undefined, false)).toBe(false);
    expect(isFinanceReferenceSignupEnabled('false', false)).toBe(false);
    expect(isFinanceReferenceSignupEnabled('true', true)).toBe(false);
    expect(isFinanceReferenceSignupEnabled('true', false)).toBe(true);
  });

  it('reference auth keeps the same gate, so a PROD build never shows the reference panel', () => {
    expect(isFinanceReferenceAuthEnabled('true', true)).toBe(false);
    expect(isFinanceReferenceAuthEnabled('true', false)).toBe(true);
  });
});

describe('validateFinanceReferenceSignup (client mirror of platform policy)', () => {
  it('accepts a letter+digit password between 10 and 72 bytes and normalizes the email', () => {
    expect(validateFinanceReferenceSignup(VALID)).toEqual({
      email: 'Dev.Account@Example.test',
      password: 'devpass2026',
    });
  });

  it.each([
    ['empty email', { email: '  ', password: 'devpass2026' }],
    ['malformed email', { email: 'not-an-email', password: 'devpass2026' }],
    ['short password', { email: 'a@b.test', password: 'abc123' }],
    ['no digit', { email: 'a@b.test', password: 'onlyletters' }],
    ['no letter', { email: 'a@b.test', password: '1234567890' }],
    ['password equals email', { email: 'a@b.test', password: 'A@B.TEST' }],
    ['over 72 bytes', { email: 'a@b.test', password: `a1${'x'.repeat(71)}` }],
    ['control character', { email: 'a@b.test', password: 'devpass2026\n' }],
  ])('rejects %s before any network call', async (_label, credentials) => {
    const fetchImpl = vi.fn<FinanceReferenceFetch>();
    const port = new FinanceReferenceSignupPort(fetchImpl);
    expect(await codeOf(port.signup(credentials))).toBe('invalid_request');
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('FinanceReferenceSignupPort', () => {
  it('POSTs email and password to the signup endpoint with no credentials and resolves on 201', async () => {
    const fetchImpl = vi.fn<FinanceReferenceFetch>(async () =>
      jsonResponse(201, {
        status: 201,
        data: { accountId: 'a', email: 'dev.account@example.test' },
      }),
    );
    await new FinanceReferenceSignupPort(fetchImpl).signup(VALID);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(SIGNUP_URL);
    expect(init?.method).toBe('POST');
    expect(init?.credentials).toBe('omit');
    expect(JSON.parse(String(init?.body))).toEqual(VALID);
  });

  it.each([
    [400, 'invalid_request'],
    [409, 'account_exists'],
    [404, 'unavailable'],
    [503, 'unavailable'],
    [500, 'unavailable'],
    [200, 'invalid_response'],
  ])('maps HTTP %i to %s', async (status, code) => {
    const port = new FinanceReferenceSignupPort(async () => jsonResponse(status, {}));
    expect(await codeOf(port.signup(VALID))).toBe(code);
  });

  it('maps a network failure to unavailable', async () => {
    const port = new FinanceReferenceSignupPort(async () => {
      throw new TypeError('network down');
    });
    expect(await codeOf(port.signup(VALID))).toBe('unavailable');
  });
});

describe('FinanceReferenceAuthSession.signup', () => {
  it('does not sign in or change the in-memory session', async () => {
    const fetchImpl = vi.fn<FinanceReferenceFetch>(async () => jsonResponse(201, {}));
    const session = new FinanceReferenceAuthSession(true, fetchImpl);
    await session.signup(VALID);

    expect(session.getSnapshot()).toEqual({ state: 'guest', session: null });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('is refused when reference auth is disabled', async () => {
    const fetchImpl = vi.fn<FinanceReferenceFetch>();
    const session = new FinanceReferenceAuthSession(false, fetchImpl);
    expect(await codeOf(session.signup(VALID))).toBe('disabled');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('keeps the access token in memory only: no Web Storage write on login', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const fetchImpl = vi.fn<FinanceReferenceFetch>(async () =>
      jsonResponse(200, {
        status: 200,
        data: {
          accessToken: 'memory-only-token',
          tokenType: 'Bearer',
          expiresAt: new Date(Date.now() + 120_000).toISOString(),
        },
      }),
    );
    const session = new FinanceReferenceAuthSession(true, fetchImpl);
    await session.login({ userId: 'dev.account@example.test', password: 'devpass2026' });

    expect(session.getSnapshot().state).toBe('authenticated');
    expect(setItem).not.toHaveBeenCalled();
    expect(window.localStorage.length + window.sessionStorage.length).toBe(0);
  });
});
