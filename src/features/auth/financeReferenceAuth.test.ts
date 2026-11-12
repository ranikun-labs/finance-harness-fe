import { describe, expect, it, vi } from 'vitest';

import {
  FinanceReferenceAuthError,
  FinanceReferenceAuthSession,
  FinanceReferenceLoginPort,
  isFinanceReferenceAuthEnabled,
  type FinanceReferenceFetch,
} from '@/features/auth/financeReferenceAuth';

function loginResponse(
  status = 200,
  data: unknown = {
    accessToken: 'fixture-access-token',
    tokenType: 'Bearer',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  },
) {
  return new Response(JSON.stringify({ status: 200, message: 'ok', data }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

describe('Finance reference auth', () => {
  it('enables only an explicit nonproduction opt-in', () => {
    expect(isFinanceReferenceAuthEnabled(undefined, false)).toBe(false);
    expect(isFinanceReferenceAuthEnabled('true', true)).toBe(false);
    expect(isFinanceReferenceAuthEnabled('true', false)).toBe(true);
  });

  it('uses the exact access-only login request and rejects token-pair fields', async () => {
    const fetchMock = vi.fn<FinanceReferenceFetch>();
    fetchMock.mockResolvedValueOnce(loginResponse());
    const port = new FinanceReferenceLoginPort(fetchMock);
    await expect(
      port.login({ userId: 'selected-fixture', password: 'fixture-password' }),
    ).resolves.toMatchObject({
      accessToken: 'fixture-access-token',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [input, init] = fetchMock.mock.calls[0] ?? [];
    expect(input).toBe('/api/v1/auth/finance-reference/login');
    expect(init?.method).toBe('POST');
    expect(init?.credentials).toBe('omit');
    expect(init?.cache).toBe('no-store');
    expect(JSON.parse(String(init?.body))).toEqual({
      userId: 'selected-fixture',
      password: 'fixture-password',
    });
    expect(new Headers(init?.headers).has('Authorization')).toBe(false);

    fetchMock.mockResolvedValueOnce(
      loginResponse(200, {
        accessToken: 'fixture-access-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        refreshToken: 'must-not-be-consumed',
      }),
    );
    await expect(
      port.login({ userId: 'selected-fixture', password: 'fixture-password' }),
    ).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });

  it('rejects passwords over the contract byte limit before sending credentials', async () => {
    const fetchMock = vi.fn<FinanceReferenceFetch>();
    const port = new FinanceReferenceLoginPort(fetchMock);

    await expect(
      port.login({ userId: 'selected-fixture', password: 'p'.repeat(73) }),
    ).rejects.toMatchObject({ code: 'invalid_request' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('attaches only the current memory bearer and preserves Journal input; a 401 clears that epoch', async () => {
    const fetchMock = vi.fn<FinanceReferenceFetch>();
    fetchMock.mockResolvedValueOnce(loginResponse());
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    const auth = new FinanceReferenceAuthSession(true, fetchMock);
    await auth.login({ userId: 'selected-fixture', password: 'fixture-password' });

    const controller = new AbortController();
    const response = await auth.fetch('/finance/journals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'same-key' },
      body: '{"entry":"preserved"}',
      signal: controller.signal,
    });
    expect(response.status).toBe(401);
    expect(auth.getSnapshot().state).toBe('guest');
    const [, request] = fetchMock.mock.calls[1] ?? [];
    const headers = new Headers(request?.headers);
    expect(headers.get('Authorization')).toBe('Bearer fixture-access-token');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('Idempotency-Key')).toBe('same-key');
    expect(request?.body).toBe('{"entry":"preserved"}');
    expect(request?.signal).toBe(controller.signal);
    expect(request?.credentials).toBe('omit');
    auth.dispose();
  });

  it('blocks external and guest Journal requests without sending them', async () => {
    const fetchMock = vi.fn<FinanceReferenceFetch>();
    fetchMock.mockResolvedValueOnce(loginResponse());
    const auth = new FinanceReferenceAuthSession(true, fetchMock);
    await auth.login({ userId: 'selected-fixture', password: 'fixture-password' });
    await expect(auth.fetch('https://outside.invalid/finance/journals')).rejects.toBeInstanceOf(
      FinanceReferenceAuthError,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    auth.localLogout();
    await expect(auth.fetch('/finance/journals?limit=20')).rejects.toMatchObject({
      code: 'unauthenticated',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    auth.dispose();
  });

  it.each([200, 401])(
    'discards an old Journal response after a new login (status %s)',
    async (status) => {
      let resolveOldRequest!: (response: Response) => void;
      const fetchMock = vi.fn<FinanceReferenceFetch>();
      fetchMock.mockResolvedValueOnce(
        loginResponse(200, {
          accessToken: 'account-a-token',
          tokenType: 'Bearer',
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
        }),
      );
      fetchMock.mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveOldRequest = resolve;
          }),
      );
      fetchMock.mockResolvedValueOnce(
        loginResponse(200, {
          accessToken: 'account-b-token',
          tokenType: 'Bearer',
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
        }),
      );

      const auth = new FinanceReferenceAuthSession(true, fetchMock);
      await auth.login({ userId: 'account-a', password: 'fixture-password' });
      const oldRequest = auth.fetch('/finance/journals');
      const switchAccount = auth.login({ userId: 'account-b', password: 'fixture-password' });
      expect(auth.getSnapshot().state).toBe('guest');
      await switchAccount;

      resolveOldRequest(
        new Response(status === 200 ? JSON.stringify({ data: { items: ['account-a'] } }) : null, {
          status,
        }),
      );
      await expect(oldRequest).rejects.toMatchObject({ code: 'stale_attempt' });
      expect(auth.getSnapshot()).toMatchObject({
        state: 'authenticated',
        session: { accessToken: 'account-b-token' },
      });
      auth.dispose();
    },
  );

  it.each(['local logout', 'disposal', 'request abort'] as const)(
    'does not install a login response that completes after %s',
    async (boundary) => {
      let resolveLogin!: (response: Response) => void;
      const fetchMock = vi.fn<FinanceReferenceFetch>();
      fetchMock.mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveLogin = resolve;
          }),
      );
      const auth = new FinanceReferenceAuthSession(true, fetchMock);
      const controller = new AbortController();
      const pendingLogin = auth.login(
        { userId: 'account-a', password: 'fixture-password' },
        boundary === 'request abort' ? controller.signal : undefined,
      );
      if (boundary === 'local logout') auth.localLogout();
      else if (boundary === 'disposal') auth.dispose();
      else controller.abort();
      resolveLogin(loginResponse());

      await expect(pendingLogin).rejects.toMatchObject({ code: 'stale_attempt' });
      expect(auth.getSnapshot()).toMatchObject({ state: 'guest', session: null });
      if (boundary !== 'disposal') auth.dispose();
    },
  );

  it('does not restore the previous account after a failed account switch', async () => {
    const fetchMock = vi.fn<FinanceReferenceFetch>();
    fetchMock.mockResolvedValueOnce(loginResponse());
    fetchMock.mockResolvedValueOnce(loginResponse(401));
    const auth = new FinanceReferenceAuthSession(true, fetchMock);

    await auth.login({ userId: 'account-a', password: 'fixture-password' });
    await expect(
      auth.login({ userId: 'account-b', password: 'wrong-password' }),
    ).rejects.toMatchObject({ code: 'unauthorized' });

    expect(auth.getSnapshot()).toMatchObject({ state: 'guest', session: null });
    auth.dispose();
  });
});
