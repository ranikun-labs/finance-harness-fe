import { PageSkeleton } from '@/components/layout/PageSkeleton';
import { useTranslation } from '@/i18n/I18nContext';

/** 공개 웹 학습(`/:locale/learn/*`) placeholder. 실제 UI는 후속 STEP에서 구현한다. */
export function LearnPage() {
  const { t } = useTranslation();
  return <PageSkeleton title={t('public.learn.title')} />;
}
