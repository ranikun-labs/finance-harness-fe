import { resolveFinanceApiBase } from '@/features/finance-api/financeApiBasePolicy';

/**
 * Browser-facing Finance API base path, read once from `VITE_FINANCE_API_BASE`.
 *
 * `vite.config.ts` validates the same value at build time, so a malformed base fails the build
 * instead of reaching the runtime throw below. Every Finance journal adapter and the reference-auth
 * request guard reads this single constant, so the request path cannot drift between them.
 */
export const FINANCE_API_BASE = resolveFinanceApiBase(import.meta.env.VITE_FINANCE_API_BASE);
export const FINANCE_JOURNALS_PATH = `${FINANCE_API_BASE}/journals`;
