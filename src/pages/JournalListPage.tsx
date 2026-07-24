import { PageSkeleton } from '@/components/layout/PageSkeleton';
import { useTranslation } from '@/i18n/I18nContext';

export function JournalListPage() {
  const { t } = useTranslation();
  return <PageSkeleton title={t('app.journalList.title')} />;
}
