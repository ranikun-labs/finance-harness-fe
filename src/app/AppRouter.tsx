import { Route, Routes } from 'react-router';

import { AppShell } from '@/components/layout/AppShell';
import { TabLayout } from '@/components/layout/TabLayout';
import { ROUTE_PATHS, toRelativeRoutePath } from '@/constants/routes';
import { AskPage } from '@/pages/AskPage';
import { HomePage } from '@/pages/HomePage';
import { JournalDetailPage } from '@/pages/JournalDetailPage';
import { JournalListPage } from '@/pages/JournalListPage';
import { JournalNewPage } from '@/pages/JournalNewPage';
import { JournalReviewPage } from '@/pages/JournalReviewPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { OnboardingPage } from '@/pages/OnboardingPage';

/** 유일한 라우트 트리 정의처. 경로 문자열 기준은 src/constants/routes.ts. */
export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route element={<TabLayout />}>
          <Route index element={<HomePage />} />
          <Route path={toRelativeRoutePath(ROUTE_PATHS.ask)} element={<AskPage />} />
          <Route
            path={toRelativeRoutePath(ROUTE_PATHS.journalList)}
            element={<JournalListPage />}
          />
        </Route>

        <Route path={toRelativeRoutePath(ROUTE_PATHS.onboarding)} element={<OnboardingPage />} />
        <Route path={toRelativeRoutePath(ROUTE_PATHS.journalNew)} element={<JournalNewPage />} />
        <Route
          path={toRelativeRoutePath(ROUTE_PATHS.journalDetail)}
          element={<JournalDetailPage />}
        />
        <Route
          path={toRelativeRoutePath(ROUTE_PATHS.journalReview)}
          element={<JournalReviewPage />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
