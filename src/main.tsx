import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import { AppRouter } from '@/app/AppRouter';
import { createFinanceReferenceSignup } from '@/features/auth/financeReferenceSignup';
import { createProductionJournalCreatePort } from '@/features/journal-new/adapter/productionJournalCreatePort';
import { isDevAcceptanceFlagEnabled } from '@/features/finance-api/devAcceptanceGate';
import { shouldHydrate } from '@/prerender/shouldHydrate';

import '@/styles/globals.css';

const rootElement = document.getElementById('root')!;
// DEV acceptance switches are honored only in the `dev-acceptance` build mode, never in PROD.
const journalCreatePort = isDevAcceptanceFlagEnabled(
  import.meta.env.VITE_FINANCE_JOURNAL_CREATE_ENABLED,
  import.meta.env.MODE,
)
  ? createProductionJournalCreatePort()
  : undefined;
// Signup is injected only behind a literal build-time gate: Vite folds it to `undefined` in PROD,
// which lets the bundler drop the signup module and its endpoint string from the output.
const financeReferenceSignup =
  import.meta.env.MODE === 'dev-acceptance' &&
  import.meta.env.VITE_FINANCE_REFERENCE_SIGNUP_ENABLED === 'true'
    ? createFinanceReferenceSignup()
    : undefined;

const tree = (
  <StrictMode>
    <BrowserRouter>
      <AppRouter
        journalCreatePort={journalCreatePort}
        journalCreateMode={journalCreatePort ? 'production' : undefined}
        financeReferenceSignup={financeReferenceSignup}
      />
    </BrowserRouter>
  </StrictMode>
);

/**
 * 공개 웹 Pre-render 산출물(root에 `data-render-mode="prerender"` marker 포함)은
 * `hydrateRoot`로 재사용해 전체 DOM을 지웠다 다시 그리지 않는다. 그 외(SPA shell,
 * `/app/*` 포함)는 기존과 동일하게 `createRoot`로 처음부터 렌더한다.
 */
if (shouldHydrate(rootElement)) {
  hydrateRoot(rootElement, tree);
} else {
  createRoot(rootElement).render(tree);
}
