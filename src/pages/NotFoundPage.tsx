import { Link } from 'react-router';

import { buttonVariants } from '@/components/ui/button';
import { APP_ROUTE_PATHS } from '@/constants/routes';
import { useTranslation } from '@/i18n/I18nContext';

/**
 * 웹앱(`/app/*`) 표면 전용 NotFound. 공개 웹 NotFound는 `PublicNotFoundPage`가 담당한다.
 * `AppShell`이 제공하는 `AppLocaleProvider`의 앱 locale을 그대로 쓴다 — 이 화면
 * 전용 fallback provider는 없다(항상 `AppShell` 하위에서만 렌더되므로 URL 기반
 * fallback이 불필요하다).
 */
export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-4 pb-[env(safe-area-inset-bottom)] text-center">
      <h1 className="text-foreground text-lg font-semibold">{t('app.notFound.heading')}</h1>
      <p className="text-text-tertiary text-sm">{t('app.notFound.description')}</p>
      <Link to={APP_ROUTE_PATHS.appHome} className={buttonVariants({ variant: 'default' })}>
        {t('app.notFound.backHome')}
      </Link>
    </div>
  );
}
