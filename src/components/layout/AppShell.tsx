import { Suspense, useState } from 'react';
import { Link, Outlet, matchPath, useLocation } from 'react-router';

import { LazyLoadingFallback } from '@/components/layout/LazyLoadingFallback';
import { HeaderNavSlotContext } from '@/components/layout/HeaderNavSlot';
import { SkipLink } from '@/components/layout/SkipLink';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
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
function AppHeader({ onNavSlot }: { onNavSlot: (node: HTMLDivElement | null) => void }) {
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
        'border-border bg-background flex min-h-14 shrink-0 items-center gap-3 border-b px-4 sm:px-6',
        // 폰의 안쪽 화면(작성·상세·복기)은 화면 자체의 뒤로 가기 줄이 머리다. 제품 이름 줄은 접고,
        // 화면 모드 버튼만 남긴 44px 줄을 둔다(F3 F-08: 안쪽 화면에서도 모드 변경에 닿게 한다).
        // 태블릿 이상은 제품 이름 줄을 그대로 유지한다.
        mayContainJournalEdits && 'max-md:min-h-11 max-md:px-2 max-md:py-0',
      )}
    >
      {mayContainJournalEdits ? (
        <span className="text-foreground inline-flex min-h-11 items-center px-2 text-sm font-bold max-md:hidden">
          {t('common.appName')}
        </span>
      ) : (
        <Link
          to={APP_ROUTE_PATHS.appHome}
          className="text-foreground inline-flex min-h-11 items-center rounded-md px-2 text-sm font-bold"
        >
          {t('common.appName')}
        </Link>
      )}
      {/*
        상단 내비 viewport(태블릿 768~1279 세로)에서 TabLayout이 primary navigation을 이 자리로 옮겨
        제품 이름 · 내비 · 로그인을 한 줄에 둔다. DOM 순서도 이름 → 내비 → 로그인으로 시각 순서와 같다.
        비어 있으면(폰·rail) 로그인 링크를 오른쪽 끝으로 미는 여백일 뿐이다.
      */}
      <div ref={onNavSlot} className="ml-auto flex items-center" />
      {showSignIn && (
        <Link
          to={AUTH_ROUTE_PATHS.entry}
          state={{
            fallbackCancelTarget: APP_ROUTE_PATHS.appHome,
            fallbackCancelLabel: 'auth.entry.cancelReviewStart',
          }}
          className="text-primary inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold hover:underline"
        >
          {t('nav.signIn')}
        </Link>
      )}
      <ThemeSwitcher />
    </header>
  );
}

export function AppShell() {
  const [navSlot, setNavSlot] = useState<HTMLElement | null>(null);
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
          <AppHeader onNavSlot={setNavSlot} />
          <HeaderNavSlotContext.Provider value={navSlot}>
            <Suspense fallback={<LazyLoadingFallback asMain />}>
              <Outlet />
            </Suspense>
          </HeaderNavSlotContext.Provider>
        </div>
      </div>
    </AppLocaleProvider>
  );
}
