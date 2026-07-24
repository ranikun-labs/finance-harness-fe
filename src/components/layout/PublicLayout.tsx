import { Outlet, useParams } from 'react-router';

import { PublicNotFoundPage } from '@/pages/public/PublicNotFoundPage';
import { isSupportedLocale } from '@/constants/routes';

/**
 * 공개 웹(`/:locale/*`)의 레이아웃 겸 locale 검증 choke point.
 * 지원하지 않는 locale(예: `/fr`, `/ja`)은 redirect하지 않고 PublicNotFound를 렌더한다.
 * 실제 공개 웹 셸/헤더 UI는 후속 STEP(9)에서 구현한다 — 지금은 최소 통과 레이아웃이다.
 */
export function PublicLayout() {
  const { locale } = useParams<{ locale: string }>();

  if (!isSupportedLocale(locale)) {
    return <PublicNotFoundPage />;
  }

  return <Outlet />;
}
