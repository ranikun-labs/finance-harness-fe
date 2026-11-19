import { ArrowRight, CircleCheckBig } from 'lucide-react';
import { Link } from 'react-router';

import { buttonVariants } from '@/components/ui/button';
import { APP_ROUTE_PATHS } from '@/constants/routes';
import { useTranslation } from '@/i18n/I18nContext';

export function PublicHomePage() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col justify-center px-6 py-16 sm:px-10">
      <div className="max-w-2xl">
        <span className="text-primary mb-6 inline-flex items-center gap-2 text-sm font-bold">
          <CircleCheckBig aria-hidden="true" className="size-5" />
          {t('common.appName')}
        </span>
        <h1 className="text-foreground text-4xl leading-tight font-bold tracking-tight break-keep sm:text-5xl">
          {t('public.home.title')}
        </h1>
        <p className="text-muted-foreground mt-6 max-w-xl text-lg leading-relaxed break-keep">
          {t('public.home.description')}
        </p>
        <Link
          to={APP_ROUTE_PATHS.appHome}
          className={buttonVariants({ size: 'lg', className: 'mt-8' })}
        >
          {t('public.home.action')} <ArrowRight aria-hidden="true" />
        </Link>
        <p className="text-muted-foreground mt-4 text-sm">{t('public.home.note')}</p>
      </div>
    </section>
  );
}
