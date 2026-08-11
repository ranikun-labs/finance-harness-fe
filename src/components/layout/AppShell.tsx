import { Outlet } from 'react-router';

import { AppLocaleProvider } from '@/i18n/AppLocaleProvider';

/** 승인된 Desktop contract의 앱 host 최대 폭. 그 이하에서는 viewport 폭을 전부 쓴다. */
export const APP_SHELL_MAX_WIDTH = '1360px';

/**
 * 앱(`/app/*`) URL 경계이자 앱 locale choke point. `PublicLayout`과 대칭 구조로
 * `AppLocaleProvider`가 하위 전체(`TabLayout` 포함)에 앱 locale(localStorage →
 * navigator.language → DEFAULT_LOCALE 우선순위로 복원)을 제공한다. URL에는 locale
 * prefix가 없다 — 공개 웹과 무관한 별도 상태다.
 */
export function AppShell() {
  return (
    <AppLocaleProvider>
      <div className="bg-muted flex h-dvh w-full justify-center overflow-hidden">
        <div
          className="bg-background flex h-full min-h-0 w-full flex-col overflow-x-hidden overflow-y-auto pt-[env(safe-area-inset-top)] xl:shadow-xl"
          data-testid="app-shell-host"
          style={{ maxWidth: APP_SHELL_MAX_WIDTH }}
        >
          <Outlet />
        </div>
      </div>
    </AppLocaleProvider>
  );
}
