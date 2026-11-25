/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FINANCE_JOURNAL_CREATE_ENABLED?: string;
  readonly VITE_FINANCE_REFERENCE_AUTH_ENABLED?: string;
  /** DEV-only account creation inside the reference panel. Default OFF; ignored in PROD builds. */
  readonly VITE_FINANCE_REFERENCE_SIGNUP_ENABLED?: string;
  /** Browser Finance API base path. Default `/finance`; DEV uses `/api/finance` (Gateway route). */
  readonly VITE_FINANCE_API_BASE?: string;
}
