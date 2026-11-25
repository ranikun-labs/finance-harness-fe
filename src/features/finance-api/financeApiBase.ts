/**
 * Browser-facing Finance API base path.
 *
 * Production keeps the same-origin `/finance` contract. The DEV acceptance slice sets
 * `VITE_FINANCE_API_BASE=/api/finance` so the browser reaches the Gateway route
 * (`/api/finance/**`, StripPrefix=1). Every Finance journal adapter and the reference-auth
 * request guard read this single constant, so the request path cannot drift between them.
 */
export const DEFAULT_FINANCE_API_BASE = '/finance';

const SAME_ORIGIN_ABSOLUTE_PATH = /^\/[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/;

/** Fails closed: a malformed base must not silently send journal traffic to an unintended path. */
export function resolveFinanceApiBase(raw: string | undefined): string {
  const value = raw?.trim() ?? '';
  if (value === '') return DEFAULT_FINANCE_API_BASE;
  if (!SAME_ORIGIN_ABSOLUTE_PATH.test(value) || value.includes('..')) {
    throw new Error(
      'VITE_FINANCE_API_BASE must be a same-origin absolute path such as /api/finance.',
    );
  }
  return value;
}

export const FINANCE_API_BASE = resolveFinanceApiBase(import.meta.env.VITE_FINANCE_API_BASE);
export const FINANCE_JOURNALS_PATH = `${FINANCE_API_BASE}/journals`;
