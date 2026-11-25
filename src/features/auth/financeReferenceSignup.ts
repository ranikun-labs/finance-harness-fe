import {
  FinanceReferenceAuthError,
  type FinanceReferenceFetch,
} from '@/features/auth/financeReferenceAuth';

/**
 * DEV-only account creation for the reference panel.
 *
 * Kept out of `financeReferenceAuth.ts` on purpose: the signup endpoint must not exist in a PROD
 * bundle. Composition (`src/main.tsx`) imports this module only behind the DEV acceptance gate,
 * so the bundler drops it from the production output.
 */
const SIGNUP_PATH = '/api/v1/auth/finance-reference/signup';
const MAX_PASSWORD_BYTES = 72;
const MIN_SIGNUP_PASSWORD_BYTES = 10; // Mirrors platform FinanceReferenceSignupService policy.
const MAX_EMAIL_BYTES = 254;
const SIGNUP_TIMEOUT_MS = 15_000;

export interface FinanceReferenceSignupCredentials {
  email: string;
  password: string;
}

export type FinanceReferenceSignupFn = (
  credentials: FinanceReferenceSignupCredentials,
  signal?: AbortSignal,
) => Promise<void>;

/**
 * Client-side mirror of the platform signup policy, for fast feedback only. The server is
 * authoritative and still answers 400 for anything this misses.
 */
export function validateFinanceReferenceSignup(credentials: FinanceReferenceSignupCredentials) {
  const email = credentials.email.trim();
  const passwordBytes = new TextEncoder().encode(credentials.password).byteLength;
  const hasLetter = /[A-Za-z]/.test(credentials.password);
  const hasDigit = /[0-9]/.test(credentials.password);
  if (
    email === '' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    new TextEncoder().encode(email).byteLength > MAX_EMAIL_BYTES ||
    passwordBytes < MIN_SIGNUP_PASSWORD_BYTES ||
    passwordBytes > MAX_PASSWORD_BYTES ||
    !hasLetter ||
    !hasDigit ||
    credentials.password.toLowerCase() === email.toLowerCase() ||
    [...credentials.password].some(isControlCharacter)
  ) {
    throw new FinanceReferenceAuthError('invalid_request');
  }
  return { email, password: credentials.password };
}

/** C0 controls, DEL, and C1 controls (U+0080-U+009F). */
function isControlCharacter(ch: string) {
  const code = ch.charCodeAt(0);
  return code < 0x20 || (code >= 0x7f && code <= 0x9f);
}

/** DEV signup only. Creates an account; it never issues a token, so the user logs in afterwards. */
export class FinanceReferenceSignupPort {
  constructor(
    private readonly fetchImpl: FinanceReferenceFetch = globalThis.fetch.bind(globalThis),
  ) {}

  async signup(
    credentials: FinanceReferenceSignupCredentials,
    signal?: AbortSignal,
  ): Promise<void> {
    const validated = validateFinanceReferenceSignup(credentials);
    if (signal?.aborted) throw new FinanceReferenceAuthError('stale_attempt');

    // One controller covers both the caller's cancellation (unmount/superseded) and a hard timeout,
    // so a hung DEV backend cannot leave the form in `loading` forever.
    const controller = new AbortController();
    const abortFromCaller = () => controller.abort();
    const timeout = setTimeout(() => controller.abort(), SIGNUP_TIMEOUT_MS);
    signal?.addEventListener('abort', abortFromCaller, { once: true });

    let response: Response;
    try {
      response = await this.fetchImpl(SIGNUP_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(validated),
        credentials: 'omit',
        cache: 'no-store',
        signal: controller.signal,
      });
    } catch {
      throw new FinanceReferenceAuthError(signal?.aborted ? 'stale_attempt' : 'unavailable');
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abortFromCaller);
    }

    if (response.status === 201) return;
    if (response.status === 400) throw new FinanceReferenceAuthError('invalid_request');
    if (response.status === 409) throw new FinanceReferenceAuthError('account_exists');
    if (response.status === 404 || response.status >= 500) {
      throw new FinanceReferenceAuthError('unavailable');
    }
    throw new FinanceReferenceAuthError('invalid_response');
  }
}

/** Builds the signup callback handed to the Auth Entry panel. Never touches the login session. */
export function createFinanceReferenceSignup(
  fetchImpl?: FinanceReferenceFetch,
): FinanceReferenceSignupFn {
  const port = new FinanceReferenceSignupPort(fetchImpl);
  return (credentials, signal) => port.signup(credentials, signal);
}
