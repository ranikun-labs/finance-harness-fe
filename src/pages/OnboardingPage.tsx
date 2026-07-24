import { PageSkeleton } from '@/components/layout/PageSkeleton';
import { useTranslation } from '@/i18n/I18nContext';

export function OnboardingPage() {
  const { t } = useTranslation();
  return <PageSkeleton title={t('app.onboarding.title')} />;
}
