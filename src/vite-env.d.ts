/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FINANCE_RETROSPECTIVE_ENABLED?: string;
  readonly VITE_FINANCE_JOURNAL_SERVER_FILTER_ENABLED?: string;
  readonly VITE_FINANCE_JOURNAL_CREATE_ENABLED?: string;
  readonly VITE_FINANCE_REFERENCE_AUTH_ENABLED?: string;
}
