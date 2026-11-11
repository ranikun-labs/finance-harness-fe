export interface FinanceReferenceCredentials {
  userId: string;
  password: string;
}

export interface FinanceReferenceToken {
  accessToken: string;
  expiresAt: number;
}

export interface FinanceReferenceSession extends FinanceReferenceToken {
  epoch: number;
}

export type FinanceReferenceAuthState = 'unknown' | 'guest' | 'authenticated';

export type FinanceReferenceAuthErrorCode =
  | 'disabled'
  | 'invalid_request'
  | 'unauthorized'
  | 'unavailable'
  | 'invalid_response'
  | 'stale_attempt'
  | 'external_request'
  | 'unauthenticated';

export class FinanceReferenceAuthError extends Error {
  constructor(readonly code: FinanceReferenceAuthErrorCode) {
    super(code);
    this.name = 'FinanceReferenceAuthError';
  }
}

export type FinanceReferenceFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

interface Snapshot {
  state: FinanceReferenceAuthState;
  session: FinanceReferenceSession | null;
}

const LOGIN_PATH = '/api/v1/auth/finance-reference/login';
const JOURNAL_PATH = '/finance/journals';
const MAX_LOGIN_BODY_BYTES = 2048;
const MAX_USER_ID_BYTES = 128;
const MAX_PASSWORD_BYTES = 72;
const MAX_RESPONSE_TOKEN_BYTES = 8192;
const MAX_CLIENT_LIFETIME_MS = 330_000; // 300s token lifetime plus the 30s issuer clock skew.

export function isFinanceReferenceAuthEnabled(flag: string | undefined, production: boolean) {
  return flag === 'true' && !production;
}

export class FinanceReferenceLoginPort {
  constructor(
    private readonly fetchImpl: FinanceReferenceFetch = globalThis.fetch.bind(globalThis),
  ) {}

  async login(
    credentials: FinanceReferenceCredentials,
    signal?: AbortSignal,
  ): Promise<FinanceReferenceToken> {
    const userIdBytes = new TextEncoder().encode(credentials.userId).byteLength;
    const passwordBytes = new TextEncoder().encode(credentials.password).byteLength;
    if (
      credentials.userId.trim() === '' ||
      credentials.password.trim() === '' ||
      userIdBytes > MAX_USER_ID_BYTES ||
      passwordBytes > MAX_PASSWORD_BYTES
    ) {
      throw new FinanceReferenceAuthError('invalid_request');
    }

    const body = JSON.stringify({ userId: credentials.userId, password: credentials.password });
    if (new TextEncoder().encode(body).byteLength > MAX_LOGIN_BODY_BYTES) {
      throw new FinanceReferenceAuthError('invalid_request');
    }

    const init: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body,
      credentials: 'omit',
      cache: 'no-store',
    };
    if (signal) init.signal = signal;

    let response: Response;
    try {
      response = await this.fetchImpl(LOGIN_PATH, init);
    } catch {
      throw new FinanceReferenceAuthError('unavailable');
    }

    if (response.status === 400) throw new FinanceReferenceAuthError('invalid_request');
    if (response.status === 401) throw new FinanceReferenceAuthError('unauthorized');
    if (response.status === 404 || response.status >= 500) {
      throw new FinanceReferenceAuthError('unavailable');
    }
    if (response.status !== 200) throw new FinanceReferenceAuthError('invalid_response');

    let envelope: unknown;
    try {
      envelope = await response.json();
    } catch {
      throw new FinanceReferenceAuthError('invalid_response');
    }

    if (typeof envelope !== 'object' || envelope === null || !('data' in envelope)) {
      throw new FinanceReferenceAuthError('invalid_response');
    }
    const data = envelope.data;
    if (typeof data !== 'object' || data === null) {
      throw new FinanceReferenceAuthError('invalid_response');
    }
    const record = data as Record<string, unknown>;
    if (
      Object.keys(record).length !== 3 ||
      Object.keys(record).some((key) => !['accessToken', 'tokenType', 'expiresAt'].includes(key)) ||
      typeof record.accessToken !== 'string' ||
      record.accessToken.trim() === '' ||
      new TextEncoder().encode(record.accessToken).byteLength > MAX_RESPONSE_TOKEN_BYTES ||
      record.tokenType !== 'Bearer' ||
      typeof record.expiresAt !== 'string' ||
      !record.expiresAt.endsWith('Z')
    ) {
      throw new FinanceReferenceAuthError('invalid_response');
    }

    const expiresAt = Date.parse(record.expiresAt);
    const remainingLifetime = expiresAt - Date.now();
    if (
      !Number.isFinite(expiresAt) ||
      remainingLifetime <= 0 ||
      remainingLifetime > MAX_CLIENT_LIFETIME_MS
    ) {
      throw new FinanceReferenceAuthError('invalid_response');
    }
    return { accessToken: record.accessToken, expiresAt };
  }
}

/** In-memory only; no browser storage or server logout/session mutation. */
export class FinanceReferenceAuthSession {
  private snapshot: Snapshot;
  private listeners = new Set<() => void>();
  private epoch = 0;
  private loginAttempt = 0;
  private expiryTimer: ReturnType<typeof setTimeout> | undefined;
  readonly loginPort: FinanceReferenceLoginPort;

  constructor(
    readonly enabled: boolean,
    fetchImpl: FinanceReferenceFetch = globalThis.fetch.bind(globalThis),
  ) {
    this.snapshot = { state: enabled ? 'guest' : 'unknown', session: null };
    this.loginPort = new FinanceReferenceLoginPort(fetchImpl);
    this.fetch = createFinanceReferenceJournalFetch(
      fetchImpl,
      () => this.getValidSession(),
      (requestEpoch) => this.invalidate(requestEpoch),
    );
  }

  readonly fetch: FinanceReferenceFetch;

  getSnapshot = () => this.snapshot;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  async login(credentials: FinanceReferenceCredentials, signal?: AbortSignal): Promise<void> {
    if (!this.enabled) throw new FinanceReferenceAuthError('disabled');
    if (signal?.aborted) throw new FinanceReferenceAuthError('stale_attempt');
    const attempt = ++this.loginAttempt;
    this.clearCurrentSession();
    const token = await this.loginPort.login(credentials, signal);
    if (signal?.aborted || attempt !== this.loginAttempt) {
      throw new FinanceReferenceAuthError('stale_attempt');
    }

    this.clearExpiryTimer();
    const session: FinanceReferenceSession = { ...token, epoch: ++this.epoch };
    this.snapshot = { state: 'authenticated', session };
    this.expiryTimer = setTimeout(
      () => this.invalidate(session.epoch),
      Math.max(0, token.expiresAt - Date.now()),
    );
    this.notify();
  }

  localLogout() {
    this.loginAttempt += 1;
    this.epoch += 1;
    this.clearExpiryTimer();
    this.snapshot = { state: this.enabled ? 'guest' : 'unknown', session: null };
    this.notify();
  }

  dispose() {
    this.loginAttempt += 1;
    this.epoch += 1;
    this.clearExpiryTimer();
    this.snapshot = { state: this.enabled ? 'guest' : 'unknown', session: null };
    this.listeners.clear();
  }

  private getValidSession() {
    const session = this.snapshot.session;
    if (session && session.expiresAt <= Date.now()) {
      this.invalidate(session.epoch);
      return null;
    }
    return session;
  }

  private invalidate(requestEpoch: number) {
    if (this.snapshot.session?.epoch !== requestEpoch) return;
    this.loginAttempt += 1;
    this.epoch += 1;
    this.clearExpiryTimer();
    this.snapshot = { state: this.enabled ? 'guest' : 'unknown', session: null };
    this.notify();
  }

  private clearExpiryTimer() {
    if (this.expiryTimer !== undefined) clearTimeout(this.expiryTimer);
    this.expiryTimer = undefined;
  }

  private clearCurrentSession() {
    if (!this.snapshot.session) return;
    this.epoch += 1;
    this.clearExpiryTimer();
    this.snapshot = { state: this.enabled ? 'guest' : 'unknown', session: null };
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }
}

export function createFinanceReferenceJournalFetch(
  fetchImpl: FinanceReferenceFetch,
  getSession: () => FinanceReferenceSession | null,
  onUnauthorized: (epoch: number) => void,
): FinanceReferenceFetch {
  return async (input, init) => {
    const rawUrl =
      typeof Request !== 'undefined' && input instanceof Request ? input.url : String(input);
    const origin = globalThis.location?.origin ?? 'http://localhost';
    let target: URL;
    try {
      target = new URL(rawUrl, origin);
    } catch {
      throw new FinanceReferenceAuthError('external_request');
    }
    if (target.origin !== origin) throw new FinanceReferenceAuthError('external_request');

    const method = (
      init?.method ??
      (typeof Request !== 'undefined' && input instanceof Request ? input.method : 'GET')
    ).toUpperCase();
    const isJournalBase = target.pathname === JOURNAL_PATH;
    const isJournalDetail =
      /^\/finance\/journals\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
        target.pathname,
      );
    const isDeletedList = target.pathname === '/finance/journals/deleted';
    const isLifecycle =
      /^\/finance\/journals\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/(delete|restore)$/.test(
        target.pathname,
      );
    const protectedPath = isJournalBase || target.pathname.startsWith(`${JOURNAL_PATH}/`);
    if (!protectedPath) {
      return fetchImpl(input, { ...init, credentials: 'omit' });
    }
    if (
      !(isJournalBase && (method === 'GET' || method === 'POST')) &&
      !(isJournalDetail && (method === 'GET' || method === 'PATCH')) &&
      !(isDeletedList && method === 'GET') &&
      !(isLifecycle && method === 'POST')
    ) {
      throw new FinanceReferenceAuthError('external_request');
    }

    const session = getSession();
    if (!session || session.expiresAt <= Date.now()) {
      if (session) onUnauthorized(session.epoch);
      throw new FinanceReferenceAuthError('unauthenticated');
    }

    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );
    new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
    headers.set('Authorization', `Bearer ${session.accessToken}`);
    const response = await fetchImpl(input, { ...init, headers, credentials: 'omit' });
    if (response.status === 401) {
      if (getSession()?.epoch !== session.epoch) {
        throw new FinanceReferenceAuthError('stale_attempt');
      }
      onUnauthorized(session.epoch);
      return response;
    }
    if (getSession()?.epoch !== session.epoch) {
      throw new FinanceReferenceAuthError('stale_attempt');
    }
    return response;
  };
}
