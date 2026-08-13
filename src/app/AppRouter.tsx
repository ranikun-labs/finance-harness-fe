import { Route, Routes, useLocation } from 'react-router';

import { RootRedirect } from '@/app/RootRedirect';
import { AppShell } from '@/components/layout/AppShell';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { TabLayout } from '@/components/layout/TabLayout';
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
import { AskPage } from '@/pages/AskPage';
import { AuthEntryPage } from '@/pages/AuthEntryPage';
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
import { resolveJournalType } from '@/features/journal-new/model/journalType';

/** `/:locale` — 공개 웹 브랜치의 base(중첩 상대 경로 파생용). */
const LOCALE_BASE = PUBLIC_ROUTE_PATHS.localeHome;

function AuthEntryRoute() {
  return (
    <AppLocaleProvider>
      <AuthEntryPage />
    </AppLocaleProvider>
  );
}

function JournalNewAuthRequiredRoute() {
  const location = useLocation();
  const resolution = resolveJournalType(new URLSearchParams(location.search));
  if (!resolution.ok) {
    // Entry Choice and invalid-type guidance are pre-editor surfaces. The
    // auth-required boundary begins only after a concrete editor is selected.
    return <JournalNewPage />;
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
      <JournalNewPage />
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
}

export function AppRouter({ authPresentation }: AppRouterProps = {}) {
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
          <Route element={<TabLayout />}>
            <Route index element={<HomePage />} />
            <Route path={toRelativeUnder(APP_BASE, APP_ROUTE_PATHS.ask)} element={<AskPage />} />
            <Route
              path={toRelativeUnder(APP_BASE, APP_ROUTE_PATHS.journalList)}
              element={<JournalListPage />}
            />
            <Route
              path={toRelativeUnder(APP_BASE, APP_ROUTE_PATHS.journalNew)}
              element={<JournalNewAuthRequiredRoute />}
            />
            <Route
              path={toRelativeUnder(APP_BASE, APP_ROUTE_PATHS.journalDetail)}
              element={<JournalDetailPage />}
            />
            <Route
              path={toRelativeUnder(APP_BASE, APP_ROUTE_PATHS.journalReview)}
              element={
                <AuthRequiredSurface
                  fallbackCancelTarget={APP_ROUTE_PATHS.appHome}
                  fallbackCancelLabel="auth.entry.cancelReviewStart"
                >
                  <JournalReviewPage />
                </AuthRequiredSurface>
              }
            />
          </Route>

          {/* Primary navigation을 상속하지 않는 앱 화면 (AppShell 직속) */}
          <Route
            path={toRelativeUnder(APP_BASE, APP_ROUTE_PATHS.onboarding)}
            element={<OnboardingPage />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* 어느 브랜치에도 속하지 않는 최상위 경로: 공개 NotFound로 처리(DEFAULT_LOCALE
          provider를 스스로 소유하는 PublicNotFoundFallback — 여기엔 유효한 URL locale이
          없다) */}
        <Route path="*" element={<PublicNotFoundFallback />} />
      </Routes>
    </AuthPresentationProvider>
  );
}
