import { createContext, useContext, useState, type ReactNode } from 'react';

import type { Locale } from '@/constants/routes';
import { isSupportedLocale } from '@/constants/routes';
import { resolveInitialAppLocale, writeStoredAppLocale } from '@/i18n/appLocale';
import { I18nProvider, useTranslation } from '@/i18n/I18nContext';

const AppLocaleActionsContext = createContext<((next: Locale) => void) | null>(null);

interface AppLocaleProviderProps {
  children: ReactNode;
}

/**
 * 앱(`/app/*`) 쪽 i18n choke point — `PublicLayout`과 대칭 구조로 `AppShell`이 이
 * provider로 하위 트리를 감싼다. 초기 locale은 동기 함수(`resolveInitialAppLocale`,
 * localStorage 읽기만 하는 순수 I/O)로 계산하므로 별도 loading shell이 필요 없다.
 * 공개 URL locale과는 완전히 독립적이다 — `/en` 방문이 이 상태에 영향을 주지 않는다.
 */
export function AppLocaleProvider({ children }: AppLocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => resolveInitialAppLocale());

  function setLocale(next: Locale) {
    if (!isSupportedLocale(next)) return;
    setLocaleState(next);
    writeStoredAppLocale(next);
  }

  return (
    <AppLocaleActionsContext.Provider value={setLocale}>
      <I18nProvider locale={locale}>{children}</I18nProvider>
    </AppLocaleActionsContext.Provider>
  );
}

/**
 * 앱 locale 읽기/변경 API. 설정 화면은 아직 없으므로(STEP 7 비목표) 테스트 하네스나
 * 향후 STEP 8/9의 실제 설정 UI가 이 훅을 그대로 소비한다. `<AppLocaleProvider>` 밖에서
 * 호출하면 throw한다(암묵적 fallback 없음).
 */
export function useAppLocale(): { locale: Locale; setLocale: (next: Locale) => void } {
  const { locale } = useTranslation();
  const setLocale = useContext(AppLocaleActionsContext);
  if (setLocale === null) {
    throw new Error('useAppLocale()은 <AppLocaleProvider> 내부에서만 사용할 수 있습니다.');
  }
  return { locale, setLocale };
}
