import { Route, Routes } from 'react-router';

import { RootRedirect } from '@/app/RootRedirect';
import { AppShell } from '@/components/layout/AppShell';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { TabLayout } from '@/components/layout/TabLayout';
import { APP_BASE, APP_ROUTE_PATHS, PUBLIC_ROUTE_PATHS, toRelativeUnder } from '@/constants/routes';
import { AskPage } from '@/pages/AskPage';
import { HomePage } from '@/pages/HomePage';
import { JournalDetailPage } from '@/pages/JournalDetailPage';
import { JournalListPage } from '@/pages/JournalListPage';
import { JournalNewPage } from '@/pages/JournalNewPage';
import { JournalReviewPage } from '@/pages/JournalReviewPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { FeaturesPage } from '@/pages/public/FeaturesPage';
import { LearnPage } from '@/pages/public/LearnPage';
import { PublicHomePage } from '@/pages/public/PublicHomePage';
import { PublicNotFoundFallback, PublicNotFoundPage } from '@/pages/public/PublicNotFoundPage';

/** `/:locale` — 공개 웹 브랜치의 base(중첩 상대 경로 파생용). */
const LOCALE_BASE = PUBLIC_ROUTE_PATHS.localeHome;

/**
 * 유일한 라우트 트리 정의처. 경로 문자열 기준은 src/constants/routes.ts, 경계 설계는
 * docs/route-architecture.md.
 *
 * URL 소유권은 세 갈래다.
 * - `/`         → 콘텐츠 없이 기본 로케일로 redirect (RootRedirect)
 * - `/:locale/*`→ 공개 웹 (PublicLayout이 locale 검증, 공개 NotFound 소유)
 * - `/app/*`    → 웹앱 SPA (AppShell 셸, 앱 NotFound 소유)
 *
 * `/app`은 정적 세그먼트라 동적 `/:locale`보다 우선 매칭된다(테스트로 고정).
 * 앱 URL 경계(`/app/*` = AppShell)와 하단 탭 셸 경계(TabLayout)는 동일하지 않다 —
 * 하단 탭은 TabLayout 하위 3개 화면(home/ask/journal)에만 붙고, onboarding·journal
 * 상세/신규/복기는 AppShell 직속이라 BottomNavigation을 상속하지 않는다.
 */
export function AppRouter() {
  return (
    <Routes>
      {/* 루트: 기본 로케일로 redirect 전용 */}
      <Route path="/" element={<RootRedirect />} />

      {/* 공개 웹: /:locale (ko|en) — PublicLayout이 locale을 검증한다 */}
      <Route path={LOCALE_BASE} element={<PublicLayout />}>
        <Route index element={<PublicHomePage />} />
        <Route
          path={toRelativeUnder(LOCALE_BASE, PUBLIC_ROUTE_PATHS.features)}
          element={<FeaturesPage />}
        />
        <Route
          path={toRelativeUnder(LOCALE_BASE, PUBLIC_ROUTE_PATHS.learn)}
          element={<LearnPage />}
        />
        <Route path="*" element={<PublicNotFoundPage />} />
      </Route>

      {/* 웹앱/Capacitor: /app/* — SPA. AppShell = 앱 URL 경계 */}
      <Route path={APP_BASE} element={<AppShell />}>
        {/* 하단 탭 셸(TabLayout) = home/ask/journal 3개 화면 한정 */}
        <Route element={<TabLayout />}>
          <Route index element={<HomePage />} />
          <Route path={toRelativeUnder(APP_BASE, APP_ROUTE_PATHS.ask)} element={<AskPage />} />
          <Route
            path={toRelativeUnder(APP_BASE, APP_ROUTE_PATHS.journalList)}
            element={<JournalListPage />}
          />
        </Route>

        {/* 하단 탭 없는 앱 화면 (AppShell 직속) */}
        <Route
          path={toRelativeUnder(APP_BASE, APP_ROUTE_PATHS.onboarding)}
          element={<OnboardingPage />}
        />
        <Route
          path={toRelativeUnder(APP_BASE, APP_ROUTE_PATHS.journalNew)}
          element={<JournalNewPage />}
        />
        <Route
          path={toRelativeUnder(APP_BASE, APP_ROUTE_PATHS.journalDetail)}
          element={<JournalDetailPage />}
        />
        <Route
          path={toRelativeUnder(APP_BASE, APP_ROUTE_PATHS.journalReview)}
          element={<JournalReviewPage />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* 어느 브랜치에도 속하지 않는 최상위 경로: 공개 NotFound로 처리(DEFAULT_LOCALE
          provider를 스스로 소유하는 PublicNotFoundFallback — 여기엔 유효한 URL locale이
          없다) */}
      <Route path="*" element={<PublicNotFoundFallback />} />
    </Routes>
  );
}
