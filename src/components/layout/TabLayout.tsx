import { Outlet, useLocation } from 'react-router';

import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { JournalWorkspace } from '@/components/journal/JournalWorkspace';
import { APP_ROUTE_PATHS, getAppJournalRouteKind } from '@/constants/routes';
import { cn } from '@/lib/utils';

/** 본문(스크롤 가능)과 하단 탭바(고정)의 스크롤 책임을 분리하는 레이아웃. */
export function TabLayout() {
  const { pathname } = useLocation();
  const isReviewResult = pathname === APP_ROUTE_PATHS.ask;
  const journalRouteKind = getAppJournalRouteKind(pathname);
  const isJournalWorkspace = journalRouteKind === 'list' || journalRouteKind === 'detail';
  const isRetrospectiveWorkspace = journalRouteKind === 'review';

  return (
    <div className="adaptive-shell-layout flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <main
        className={cn(
          'adaptive-content-main order-1 min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto md:order-2',
          isJournalWorkspace && 'journal-workspace-main',
          isRetrospectiveWorkspace && 'retrospective-workspace-main',
        )}
      >
        <div
          className={cn(
            'adaptive-readable-host mx-auto min-h-full w-full',
            isReviewResult
              ? 'max-w-[760px]'
              : isJournalWorkspace
                ? 'journal-workspace-host max-w-[660px]'
                : isRetrospectiveWorkspace
                  ? 'retrospective-workspace-host max-w-[660px]'
                  : 'max-w-[660px]',
          )}
          data-testid="adaptive-content-host"
        >
          {isJournalWorkspace ? <JournalWorkspace /> : <Outlet />}
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
}
