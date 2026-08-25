import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router';

import { RootRedirect } from '@/app/RootRedirect';
import { AppShell } from '@/components/layout/AppShell';
import { LazyLoadingFallback } from '@/components/layout/LazyLoadingFallback';
import { PublicLayout } from '@/components/layout/PublicLayout';
import {
  APP_BASE,
  APP_ROUTE_PATHS,
  AUTH_ROUTE_PATHS,
  PUBLIC_ROUTE_PATHS,
  toRelativeUnder,
  buildAppJournalNewPath,
} from '@/constants/routes';
import { AuthPresentationProvider } from '@/features/auth/AuthPresentationContext';
import { AuthRequiredSurface } from '@/features/auth/AuthRequiredSurface';
import type { AuthPresentationConsumer } from '@/features/auth/authPresentation';
import type { AuthResumeIntent } from '@/features/auth/authPresentation';
import { AppLocaleProvider } from '@/i18n/AppLocaleProvider';
import { FeaturesPage } from '@/pages/public/FeaturesPage';
import { LearnPage } from '@/pages/public/LearnPage';
import { PublicHomePage } from '@/pages/public/PublicHomePage';
import { PublicNotFoundFallback, PublicNotFoundPage } from '@/pages/public/PublicNotFoundPage';
import { resolveJournalType } from '@/features/journal-new/model/journalType';
import { RouteDocumentTitle } from '@/metadata/documentTitle';
import type { JournalReadPort } from '@/features/journal-read/model/journalReadPort';

/** `/:locale` — 공개 웹 브랜치의 base(중첩 상대 경로 파생용). */
const LOCALE_BASE = PUBLIC_ROUTE_PATHS.localeHome;

const LazyTabLayout = lazy(() =>
  import('@/components/layout/TabLayout').then(({ TabLayout }) => ({ default: TabLayout })),
);
const LazyAskPage = lazy(() =>
  import('@/pages/AskPage').then(({ AskPage }) => ({ default: AskPage })),
);
const LazyAuthEntryPage = lazy(() =>
  import('@/pages/AuthEntryPage').then(({ AuthEntryPage }) => ({ default: AuthEntryPage })),
);
const LazyHomePage = lazy(() =>
  import('@/pages/HomePage').then(({ HomePage }) => ({ default: HomePage })),
);
const LazyJournalDetailPage = lazy(() =>
  import('@/pages/JournalDetailPage').then(({ JournalDetailPage }) => ({
    default: JournalDetailPage,
  })),
);
const LazyJournalListPage = lazy(() =>
  import('@/pages/JournalListPage').then(({ JournalListPage }) => ({ default: JournalListPage })),
);
const LazyJournalNewPage = lazy(() =>
  import('@/pages/JournalNewPage').then(({ JournalNewPage }) => ({ default: JournalNewPage })),
);
const LazyJournalReviewPage = lazy(() =>
  import('@/pages/JournalReviewPage').then(({ JournalReviewPage }) => ({
    default: JournalReviewPage,
  })),
);
const LazyNotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then(({ NotFoundPage }) => ({ default: NotFoundPage })),
);
const LazyOnboardingPage = lazy(() =>
  import('@/pages/OnboardingPage').then(({ OnboardingPage }) => ({ default: OnboardingPage })),
);

function AuthEntryRoute() {
  return (
    <AppLocaleProvider>
      <RouteDocumentTitle />
      <Suspense fallback={<LazyLoadingFallback asMain />}>
        <LazyAuthEntryPage />
      </Suspense>
    </AppLocaleProvider>
  );
}

function JournalNewAuthRequiredRoute() {
  const location = useLocation();
  const resolution = resolveJournalType(new URLSearchParams(location.search));
  if (!resolution.ok) {
    // Entry Choice and invalid-type guidance are pre-editor surfaces. The
    // auth-required boundary begins only after a concrete editor is selected.
    return <LazyJournalNewPage />;
  }

  const resumeIntent: AuthResumeIntent | undefined = resolution.ok
    ? {
        targetRoute: buildAppJournalNewPath(resolution.type),
        recordType: resolution.type,
        returnTarget: APP_ROUTE_PATHS.journalNew,
      }
    : undefined;

  return (
    <AuthRequiredSurface
      fallbackCancelTarget={APP_ROUTE_PATHS.journalNew}
      fallbackCancelLabel="auth.entry.cancelEntry"
      resumeIntent={resumeIntent}
    >
      <LazyJournalNewPage />
    </AuthRequiredSurface>
  );
}

/**
 * 유일한 라우트 트리 정의처. 경로 문자열 기준은 src/constants/routes.ts, 경계 설계는
 * docs/route-architecture.md.
 *
 * URL 소유권은 네 갈래다.
 * - `/`         → 콘텐츠 없이 기본 로케일로 redirect (RootRedirect)
 * - `/auth`     → provider-neutral public Auth Entry (AppShell/Bottom Navigation 없음)
 * - `/:locale/*`→ 공개 웹 (PublicLayout이 locale 검증, 공개 NotFound 소유)
 * - `/app/*`    → 웹앱 SPA (AppShell 셸, 앱 NotFound 소유)
 *
 * `/app`은 정적 세그먼트라 동적 `/:locale`보다 우선 매칭된다(테스트로 고정).
 * 앱 URL 경계(`/app/*` = AppShell)와 primary navigation 셸 경계(TabLayout)는 동일하지 않다 —
 * `TabLayout`은 검토 시작(`/app`)·검토 결과(`/app/ask`)·저널 primary surface를 소유한다.
 * Phone에서는 검토 시작/저널 목록에만 하단 navigation이 노출된다. journal
 * 신규/상세/복기는 같은 adaptive primary navigation 셸을 상속하되, Phone에서는
 * context-specific 화면으로서 하단 navigation을 숨긴다.
 */
interface AppRouterProps {
  /** FE-local fixture/consumer state; production defaults to non-authoritative unknown. */
  authPresentation?: AuthPresentationConsumer;
  /** Integration seam for the server-owned Journal List/Detail read flow. */
  journalReadPort?: JournalReadPort;
}

export function AppRouter({ authPresentation, journalReadPort }: AppRouterProps = {}) {
  return (
    <AuthPresentationProvider value={authPresentation}>
      <Routes>
        {/* 루트: 기본 로케일로 redirect 전용 */}
        <Route path="/" element={<RootRedirect />} />

        {/* Provider-neutral Auth Entry — public surface without AppShell navigation. */}
        <Route path={AUTH_ROUTE_PATHS.entry} element={<AuthEntryRoute />} />

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
          {/* Adaptive primary navigation 셸 = Review/Journal primary surfaces */}
          <Route element={<LazyTabLayout journalReadPort={journalReadPort} />}>
            <Route index element={<LazyHomePage />} />
            <Route
              path={toRelativeUnder(APP_BASE, APP_ROUTE_PATHS.ask)}
              element={<LazyAskPage />}
            />
            <Route
              path={toRelativeUnder(APP_BASE, APP_ROUTE_PATHS.journalList)}
              element={<LazyJournalListPage />}
            />
            <Route
              path={toRelativeUnder(APP_BASE, APP_ROUTE_PATHS.journalNew)}
              element={<JournalNewAuthRequiredRoute />}
            />
            <Route
              path={toRelativeUnder(APP_BASE, APP_ROUTE_PATHS.journalDetail)}
              element={<LazyJournalDetailPage />}
            />
            <Route
              path={toRelativeUnder(APP_BASE, APP_ROUTE_PATHS.journalReview)}
              element={
                <AuthRequiredSurface
                  fallbackCancelTarget={APP_ROUTE_PATHS.appHome}
                  fallbackCancelLabel="auth.entry.cancelReviewStart"
                >
                  <LazyJournalReviewPage />
                </AuthRequiredSurface>
              }
            />
          </Route>

          {/* Primary navigation을 상속하지 않는 앱 화면 (AppShell 직속) */}
          <Route
            path={toRelativeUnder(APP_BASE, APP_ROUTE_PATHS.onboarding)}
            element={<LazyOnboardingPage />}
          />
          <Route path="*" element={<LazyNotFoundPage />} />
        </Route>

        {/* 어느 브랜치에도 속하지 않는 최상위 경로: 공개 NotFound로 처리(DEFAULT_LOCALE
        provider를 스스로 소유하는 PublicNotFoundFallback — 여기엔 유효한 URL locale이
        없다) */}
        <Route path="*" element={<PublicNotFoundFallback />} />
      </Routes>
    </AuthPresentationProvider>
  );
}
