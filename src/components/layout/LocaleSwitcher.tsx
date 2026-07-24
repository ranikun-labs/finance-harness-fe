import { Link, useLocation } from 'react-router';

import { SUPPORTED_LOCALES, buildLocalePeerPath } from '@/constants/routes';
import { LOCALE_LABELS } from '@/i18n/dictionary';
import { useTranslation } from '@/i18n/I18nContext';

/**
 * 공개 웹(`/:locale/*`) 전용 최소 locale 전환 컴포넌트. `PublicLayout`(URL locale이
 * 검증된 트리) 내부에만 배치되므로 `/app/*`에는 구조적으로 노출되지 않는다.
 *
 * 디자인은 STEP 8로 미룬다 — 지금은 스타일 없는 텍스트 링크 2개다. `useTranslation()`이
 * 던지지 않아야 하므로 반드시 `I18nProvider` 하위에서만 렌더된다(`PublicLayout`이
 * 이미 그 위치를 보장한다).
 */
export function LocaleSwitcher() {
  const { locale, t } = useTranslation();
  const location = useLocation();

  return (
    <nav aria-label={t('public.localeSwitcher.ariaLabel')} className="flex gap-2 p-2 text-sm">
      {SUPPORTED_LOCALES.map((target) => {
        const peerPathname = buildLocalePeerPath(location.pathname, target);
        const isCurrent = target === locale;
        return (
          <Link
            key={target}
            to={{ pathname: peerPathname, search: location.search, hash: location.hash }}
            aria-current={isCurrent ? 'true' : undefined}
          >
            {LOCALE_LABELS[target]}
          </Link>
        );
      })}
    </nav>
  );
}
