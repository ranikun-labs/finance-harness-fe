/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FINANCE_JOURNAL_CREATE_ENABLED?: string;
  readonly VITE_FINANCE_REFERENCE_AUTH_ENABLED?: string;
  /** DEV-only account creation in the reference panel. Honored only in the dev-acceptance mode. */
  readonly VITE_FINANCE_REFERENCE_SIGNUP_ENABLED?: string;
  /** Same-origin Finance API base path (all builds). Default `/finance`; DEV uses `/api/finance`. Validated at build time. */
  readonly VITE_FINANCE_API_BASE?: string;
}
