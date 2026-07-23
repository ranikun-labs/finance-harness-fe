import { Route, Routes } from 'react-router';

import { AppShell } from '@/components/layout/AppShell';
import { TabLayout } from '@/components/layout/TabLayout';
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
          <Route path="ask" element={<AskPage />} />
          <Route path="journal" element={<JournalListPage />} />
        </Route>

        <Route path="onboarding" element={<OnboardingPage />} />
        <Route path="journal/new" element={<JournalNewPage />} />
        <Route path="journal/:id" element={<JournalDetailPage />} />
        <Route path="journal/:id/review" element={<JournalReviewPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
