import { useParams } from 'react-router';

import { PageSkeleton } from '@/components/layout/PageSkeleton';
import { useTranslation } from '@/i18n/I18nContext';

export function JournalReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  return <PageSkeleton title={t('app.journalReview.title', { id: id ?? '' })} />;
}
