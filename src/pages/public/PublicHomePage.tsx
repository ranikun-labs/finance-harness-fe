import { PageSkeleton } from '@/components/layout/PageSkeleton';
import { useTranslation } from '@/i18n/I18nContext';

/** 공개 웹 홈 placeholder. 실제 랜딩 UI는 후속 STEP에서 구현한다. */
export function PublicHomePage() {
  const { t } = useTranslation();
  return <PageSkeleton title={t('public.home.title')} />;
}
