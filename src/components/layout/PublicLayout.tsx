import { Outlet, useParams } from 'react-router';

import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { PublicNotFoundFallback } from '@/pages/public/PublicNotFoundPage';
import { isSupportedLocale } from '@/constants/routes';
import { I18nProvider } from '@/i18n/I18nContext';

/**
 * 공개 웹(`/:locale/*`)의 레이아웃 겸 locale 검증·i18n 주입 choke point.
 * 지원하지 않는 locale(예: `/fr`, `/ja`)은 redirect하지 않고 PublicNotFound를 렌더한다.
 * 실제 공개 웹 셸/헤더 UI는 후속 STEP(9)에서 구현한다 — 지금은 최소 통과 레이아웃이다.
 *
 * URL locale이 유일한 source of truth다. 검증을 통과하면 그 locale로 `I18nProvider`를
 * 만들어 하위 페이지(`useTranslation()`)와 `LocaleSwitcher`에 제공한다 — 페이지가
 * 각자 `useParams`를 다시 읽지 않게 하기 위함이다. 검증에 실패하면
 * `PublicNotFoundFallback`(DEFAULT_LOCALE provider를 스스로 소유)을 렌더한다 — 이
 * 분기는 유효한 locale이 없으므로 여기서 `I18nProvider`를 만들 수 없다.
 */
export function PublicLayout() {
  const { locale } = useParams<{ locale: string }>();

  if (!isSupportedLocale(locale)) {
    return <PublicNotFoundFallback />;
  }

  return (
    <I18nProvider locale={locale}>
      <LocaleSwitcher />
      <Outlet />
    </I18nProvider>
  );
}
