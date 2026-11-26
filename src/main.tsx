import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { AppRouter } from '@/app/AppRouter';
import { LeaveGuardDataRouterScope } from '@/components/common/LeaveGuard';
import { createProductionJournalCreatePort } from '@/features/journal-new/adapter/productionJournalCreatePort';
import { shouldHydrate } from '@/prerender/shouldHydrate';
import { initTheme } from '@/theme/theme';

import '@/styles/globals.css';

// 인라인 스크립트가 첫 페인트에 적용한 화면 모드를 이어받아 시스템 변경·다른 탭 선택을 구독한다.
initTheme();

const rootElement = document.getElementById('root')!;
// Journal Create stays off by default; an explicit deployment/local opt-in enables the
// existing same-origin HTTP adapter without changing the server-owned request contract.
const journalCreatePort =
  import.meta.env.VITE_FINANCE_JOURNAL_CREATE_ENABLED === 'true'
    ? createProductionJournalCreatePort()
    : undefined;

// 이탈 보호(`useBlocker`)가 data router에서만 동작해 `createBrowserRouter`로 연다. 경로 트리는 그대로
// `AppRouter`의 `<Routes>`가 소유하므로 로더·액션 없이 splat 라우트 하나가 전체를 위임한다.
// `LeaveGuardDataRouterScope`가 Data Router 표식을 내려 `LeaveGuard`가 켜지게 한다.
const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <LeaveGuardDataRouterScope>
        <AppRouter
          journalCreatePort={journalCreatePort}
          journalCreateMode={journalCreatePort ? 'production' : undefined}
        />
      </LeaveGuardDataRouterScope>
    ),
  },
]);

const tree = (
  <StrictMode>
    <RouterProvider router={router} />
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
