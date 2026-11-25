import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';

import { BottomNavigation, type NavFocusMemory } from '@/components/layout/BottomNavigation';
import { LazyLoadingFallback } from '@/components/layout/LazyLoadingFallback';
import { PageContainer } from '@/components/layout/PageContainer';
import { RetrospectiveDraftContext } from '@/components/layout/RetrospectiveDraftContext';
import { APP_ROUTE_PATHS, getAppJournalRouteKind } from '@/constants/routes';
import { AuthRequiredSurface } from '@/features/auth/AuthRequiredSurface';
import { JournalReadPortProvider } from '@/features/journal-read/JournalReadPortContext';
import type { JournalReadPort } from '@/features/journal-read/model/journalReadPort';
import { BREAKPOINTS, MAIN_LANDMARK_ID } from '@/constants/layout';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { cn } from '@/lib/utils';

const LazyJournalWorkspace = lazy(() =>
  import('@/components/journal/JournalWorkspace').then(({ JournalWorkspace }) => ({
    default: JournalWorkspace,
  })),
);

/** 본문(스크롤 가능)과 하단 탭바(고정)의 스크롤 책임을 분리하는 레이아웃. */
export function TabLayout({ journalReadPort }: { journalReadPort?: JournalReadPort }) {
  // Tablet 이상은 내비가 본문 앞(상단·좌측)에 보이므로 DOM도 내비가 먼저다. Phone은 하단이라 본문이 먼저.
  const navFirst = useMediaQuery(`(min-width: ${BREAKPOINTS.tablet}px)`);
  const [retrospectiveDirty, setRetrospectiveDirty] = useState(false);
  // 내비가 body 앞/뒤로 옮겨 다시 마운트돼도 포커스 위치(탭)를 이어받기 위한 기억.
  const navFocusMemory: NavFocusMemory = useRef(null);
  useEffect(() => {
    // 내비 밖을 포인터로 눌러 포커스가 해제된 경우에는 기억을 버린다.
    const clear = () => {
      navFocusMemory.current = null;
    };
    document.addEventListener('pointerdown', clear, true);
    return () => document.removeEventListener('pointerdown', clear, true);
  }, []);
  const { pathname } = useLocation();
  const isReviewResult = pathname === APP_ROUTE_PATHS.ask;
  const journalRouteKind = getAppJournalRouteKind(pathname);
  const isJournalWorkspace = journalRouteKind === 'list' || journalRouteKind === 'detail';
  const isRetrospectiveWorkspace = journalRouteKind === 'review';

  return (
    <RetrospectiveDraftContext.Provider
      value={{ dirty: retrospectiveDirty, setDirty: setRetrospectiveDirty }}
    >
      <JournalReadPortProvider port={journalReadPort}>
        <div className="adaptive-shell-layout flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          {navFirst && <BottomNavigation focusMemory={navFocusMemory} />}
          <main
            id={MAIN_LANDMARK_ID}
            className={cn(
              'adaptive-content-main order-1 min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto md:order-2',
              // 고정 하단 행동이 포커스·앵커 이동 대상을 가리지 않도록 96px 여유.
              isReviewResult && 'scroll-pb-24',
              isJournalWorkspace && 'journal-workspace-main',
              isRetrospectiveWorkspace && 'retrospective-workspace-main',
            )}
          >
            <PageContainer
              size={isReviewResult ? 'result' : 'reading'}
              className={cn(
                'adaptive-readable-host',
                // 1280 이상 결과 화면은 본문 + 보조 열 폭까지 넓힌다(좁은 상태는 AskPage가 760으로 되돌린다).
                isReviewResult && 'xl:max-w-[1132px]',
                isJournalWorkspace && 'journal-workspace-host',
                isRetrospectiveWorkspace && 'retrospective-workspace-host',
              )}
              data-testid="adaptive-content-host"
            >
              {isJournalWorkspace ? (
                <AuthRequiredSurface
                  fallbackCancelTarget={APP_ROUTE_PATHS.appHome}
                  fallbackCancelLabel="auth.entry.cancelReviewStart"
                >
                  <Suspense fallback={<LazyLoadingFallback />}>
                    <LazyJournalWorkspace />
                  </Suspense>
                </AuthRequiredSurface>
              ) : (
                <Suspense fallback={<LazyLoadingFallback />}>
                  <Outlet />
                </Suspense>
              )}
            </PageContainer>
          </main>
          {!navFirst && <BottomNavigation focusMemory={navFocusMemory} />}
        </div>
      </JournalReadPortProvider>
    </RetrospectiveDraftContext.Provider>
  );
}
