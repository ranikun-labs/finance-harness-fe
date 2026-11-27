/**
 * Pure policy for the browser-facing Finance API base path. No `import.meta.env` here so that
 * `vite.config.ts` can validate `VITE_FINANCE_API_BASE` at build time with the same rule the
 * runtime applies.
 *
 * The base is same-origin only in every build (PROD included). Production keeps `/finance`; the
 * DEV acceptance build uses `/api/finance` (Gateway route, StripPrefix=1).
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
