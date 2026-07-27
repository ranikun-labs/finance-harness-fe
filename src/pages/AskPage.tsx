import { useSearchParams } from 'react-router';

import { PageSkeleton } from '@/components/layout/PageSkeleton';
import { useTranslation } from '@/i18n/I18nContext';

export function AskPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const { t } = useTranslation();

  return (
    <PageSkeleton title={query ? t('app.ask.titleWithQuery', { query }) : t('app.ask.title')} />
  );
}
