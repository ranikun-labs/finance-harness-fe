import { useSearchParams } from 'react-router';

import { PageSkeleton } from '@/components/layout/PageSkeleton';
import { useTranslation } from '@/i18n/I18nContext';

/**
 * `type` 쿼리 값('investment'/'study')은 도메인 식별자이며 번역 대상이 아니다 —
 * 표시 문구만 `t()`로 조회한다.
 */
export function JournalNewPage() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');
  const { t } = useTranslation();
  const title = type === 'study' ? t('app.journalNew.study') : t('app.journalNew.investment');

  return <PageSkeleton title={title} />;
}
