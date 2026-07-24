import { Link } from 'react-router';

import { buttonVariants } from '@/components/ui/button';
import { DEFAULT_LOCALE, buildLocaleHomePath } from '@/constants/routes';
import { I18nProvider, useTranslation } from '@/i18n/I18nContext';

/**
 * 공개 웹 표면 전용 NotFound. 앱 NotFound(`NotFoundPage`)와 분리되어 있으며, 복귀
 * 링크는 앱(`/app`)이 아니라 공개 웹 기본 로케일 홈(`/ko`)을 가리킨다.
 *
 * 이 컴포넌트 자신은 provider를 만들지 않는다 — `useTranslation()`이 던지므로
 * 항상 호출부가 `<I18nProvider>`를 제공해야 한다. 정상 `/:locale` 트리에서는
 * `PublicLayout`이 제공한 URL-locale provider를 그대로 재사용하고, locale을
 * 모르거나 신뢰할 수 없는 두 지점(unsupported locale, 최상위 catch-all)은 아래
 * `PublicNotFoundFallback`을 통해서만 렌더한다.
 */
export function PublicNotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-4 pb-[env(safe-area-inset-bottom)] text-center">
      <h1 className="text-foreground text-lg font-semibold">{t('public.notFound.heading')}</h1>
      <p className="text-text-tertiary text-sm">{t('public.notFound.description')}</p>
      <Link
        to={buildLocaleHomePath(DEFAULT_LOCALE)}
        className={buttonVariants({ variant: 'default' })}
      >
        {t('public.notFound.backHome')}
      </Link>
    </div>
  );
}

/**
 * `PublicNotFoundPage`가 provider 없이 렌더될 수 있는 두 지점 전용 진입점:
 * `PublicLayout`의 unsupported-locale 즉시 반환 분기, `AppRouter`의 최상위 `*`
 * catch-all. 둘 다 유효한 URL locale이 없으므로 `DEFAULT_LOCALE`을 명시적으로
 * 고정한다 — 저장된 앱 locale이나 `navigator.language`로 추측하지 않는다.
 */
export function PublicNotFoundFallback() {
  return (
    <I18nProvider locale={DEFAULT_LOCALE}>
      <PublicNotFoundPage />
    </I18nProvider>
  );
}
