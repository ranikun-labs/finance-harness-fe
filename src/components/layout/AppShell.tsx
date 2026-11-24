import { Suspense } from 'react';
import { Link, Outlet, matchPath, useLocation } from 'react-router';

import { LazyLoadingFallback } from '@/components/layout/LazyLoadingFallback';
import { SkipLink } from '@/components/layout/SkipLink';
import { APP_SHELL_MAX_WIDTH_PX } from '@/constants/layout';
import { APP_ROUTE_PATHS, AUTH_ROUTE_PATHS } from '@/constants/routes';
import { useAuthPresentation } from '@/features/auth/AuthPresentationContext';
import { useTranslation } from '@/i18n/I18nContext';
import { AppLocaleProvider } from '@/i18n/AppLocaleProvider';
import { RouteDocumentTitle } from '@/metadata/documentTitle';
import { cn } from '@/lib/utils';

/** 승인된 Desktop contract의 앱 host 최대 폭. 그 이하에서는 viewport 폭을 전부 쓴다. */
export const APP_SHELL_MAX_WIDTH = `${APP_SHELL_MAX_WIDTH_PX}px`;

/**
 * 앱(`/app/*`) URL 경계이자 앱 locale choke point. `PublicLayout`과 대칭 구조로
 * `AppLocaleProvider`가 하위 전체(`TabLayout` 포함)에 앱 locale(localStorage →
 * navigator.language → DEFAULT_LOCALE 우선순위로 복원)을 제공한다. URL에는 locale
 * prefix가 없다 — 공개 웹과 무관한 별도 상태다.
 */
function AppHeader() {
  const { state } = useAuthPresentation();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const showSignIn =
    matchPath({ path: APP_ROUTE_PATHS.appHome, end: true }, pathname) !== null &&
    state !== 'authenticated';
  const mayContainJournalEdits = [
    APP_ROUTE_PATHS.journalNew,
    APP_ROUTE_PATHS.journalDetail,
    APP_ROUTE_PATHS.journalReview,
  ].some((path) => matchPath({ path, end: true }, pathname) !== null);

  return (
    <header
      className={cn(
        'border-border bg-background flex min-h-14 shrink-0 items-center justify-between border-b px-4 sm:px-6',
        // 폰의 안쪽 화면(작성·상세·복기)은 화면 자체의 뒤로 가기 줄이 머리다. 제품 이름 줄이 위에 겹치면
        // 본문이 112px 아래에서 시작하므로 폰에서만 접는다(태블릿 이상은 내비와 함께 유지).
        mayContainJournalEdits && 'max-md:hidden',
      )}
    >
      {mayContainJournalEdits ? (
        <span className="text-foreground inline-flex min-h-11 items-center px-2 text-sm font-bold">
          {t('common.appName')}
        </span>
      ) : (
        <Link
          to={APP_ROUTE_PATHS.appHome}
          className="text-foreground focus-visible:ring-ring/50 inline-flex min-h-11 items-center rounded-md px-2 text-sm font-bold focus-visible:ring-3 focus-visible:outline-none"
        >
          {t('common.appName')}
        </Link>
      )}
      {showSignIn && (
        <Link
          to={AUTH_ROUTE_PATHS.entry}
          state={{
            fallbackCancelTarget: APP_ROUTE_PATHS.appHome,
            fallbackCancelLabel: 'auth.entry.cancelReviewStart',
          }}
          className="text-primary focus-visible:ring-ring/50 inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold hover:underline focus-visible:ring-3 focus-visible:outline-none"
        >
          {t('nav.signIn')}
        </Link>
      )}
    </header>
  );
}

export function AppShell() {
  return (
    <AppLocaleProvider>
      <RouteDocumentTitle />
      <div className="bg-muted flex h-dvh w-full justify-center overflow-hidden">
        <div
          className="bg-background flex h-full min-h-0 w-full flex-col overflow-x-hidden overflow-y-auto pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] xl:shadow-xl"
          data-testid="app-shell-host"
          style={{ maxWidth: APP_SHELL_MAX_WIDTH }}
        >
          <SkipLink />
          <AppHeader />
          <Suspense fallback={<LazyLoadingFallback asMain />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </AppLocaleProvider>
  );
}
