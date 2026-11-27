import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  FinanceReferenceAuthError,
  type FinanceReferenceFetch,
} from '@/features/auth/financeReferenceAuth';
import {
  createFinanceReferenceSignup,
  FinanceReferenceSignupPort,
  validateFinanceReferenceSignup,
} from '@/features/auth/financeReferenceSignup';

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

/** A fetch that only settles when its signal aborts, like a hung network request. */
function hangingFetch(): FinanceReferenceFetch {
  return (_input, init) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () =>
        reject(new DOMException('aborted', 'AbortError')),
      );
    });
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
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
    ['C0 control character (LF)', { email: 'a@b.test', password: 'devpass2026\n' }],
    ['C0 control character (NUL)', { email: 'a@b.test', password: 'devpass2026\u0000' }],
    ['DEL', { email: 'a@b.test', password: 'devpass2026\u007f' }],
    ['C1 control (U+0085 NEL)', { email: 'a@b.test', password: 'devpass2026\u0085' }],
    ['C1 control (U+009F)', { email: 'a@b.test', password: 'devpass2026\u009f' }],
  ])('rejects %s before any network call', async (_label, credentials) => {
    const fetchImpl = vi.fn<FinanceReferenceFetch>();
    const port = new FinanceReferenceSignupPort(fetchImpl);
    expect(await codeOf(port.signup(credentials))).toBe('invalid_request');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('accepts U+00A0 (NBSP), which sits just outside the C1 range', () => {
    expect(() =>
      validateFinanceReferenceSignup({ email: 'a@b.test', password: 'devpass2026 ' }),
    ).not.toThrow();
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
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(String(init?.body))).toEqual(VALID);
  });

  it('accepts a generic 202 response without account data', async () => {
    const port = new FinanceReferenceSignupPort(async () =>
      jsonResponse(202, { status: 202, message: 'Signup request processed.' }),
    );
    await expect(port.signup(VALID)).resolves.toBeUndefined();
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

  it('aborts a hung request after the timeout and maps it to unavailable', async () => {
    vi.useFakeTimers();
    const pending = codeOf(new FinanceReferenceSignupPort(hangingFetch()).signup(VALID));
    await vi.advanceTimersByTimeAsync(15_000);
    expect(await pending).toBe('unavailable');
  });

  it('aborts the request when the caller cancels and maps it to stale_attempt', async () => {
    const controller = new AbortController();
    const pending = codeOf(
      new FinanceReferenceSignupPort(hangingFetch()).signup(VALID, controller.signal),
    );
    controller.abort();
    expect(await pending).toBe('stale_attempt');
  });

  it('does not call the network when the caller has already cancelled', async () => {
    const fetchImpl = vi.fn<FinanceReferenceFetch>();
    const controller = new AbortController();
    controller.abort();
    expect(
      await codeOf(new FinanceReferenceSignupPort(fetchImpl).signup(VALID, controller.signal)),
    ).toBe('stale_attempt');
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('createFinanceReferenceSignup', () => {
  it('returns a callback that posts to the signup endpoint and resolves on 201', async () => {
    const fetchImpl = vi.fn<FinanceReferenceFetch>(async () => jsonResponse(201, {}));
    await createFinanceReferenceSignup(fetchImpl)(VALID);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe(SIGNUP_URL);
  });
});
