import { Link } from 'react-router';

import {
  OnboardingCapabilityList,
  type OnboardingCapabilityItem,
} from '@/components/onboarding/OnboardingCapabilityList';
import { PolicyNotice } from '@/components/common/PolicyNotice';
import { Card } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { APP_ROUTE_PATHS } from '@/constants/routes';
import { useTranslation } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';

export function OnboardingPage() {
  const { t } = useTranslation();

  const notProvidedItems: OnboardingCapabilityItem[] = [
    {
      title: t('app.onboarding.notProvided.items.recommendation.title'),
      description: t('app.onboarding.notProvided.items.recommendation.description'),
    },
    {
      title: t('app.onboarding.notProvided.items.priceGuidance.title'),
      description: t('app.onboarding.notProvided.items.priceGuidance.description'),
    },
    {
      title: t('app.onboarding.notProvided.items.allocation.title'),
      description: t('app.onboarding.notProvided.items.allocation.description'),
    },
    {
      title: t('app.onboarding.notProvided.items.predictionOrDelegation.title'),
      description: t('app.onboarding.notProvided.items.predictionOrDelegation.description'),
    },
  ];
  const providedItems: OnboardingCapabilityItem[] = [
    {
      title: t('app.onboarding.provided.items.questionContext.title'),
      description: t('app.onboarding.provided.items.questionContext.description'),
    },
    {
      title: t('app.onboarding.provided.items.checklist.title'),
      description: t('app.onboarding.provided.items.checklist.description'),
    },
    {
      title: t('app.onboarding.provided.items.decisionRecord.title'),
      description: t('app.onboarding.provided.items.decisionRecord.description'),
    },
    {
      title: t('app.onboarding.provided.items.review.title'),
      description: t('app.onboarding.provided.items.review.description'),
    },
  ];

  return (
    <main className="flex w-full flex-col gap-6 px-6 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="bg-primary text-primary-foreground flex size-[42px] shrink-0 items-center justify-center rounded-lg text-xl font-extrabold shadow-sm"
        >
          ✓
        </span>
        <div className="min-w-0">
          <p className="text-base font-extrabold tracking-tight">
            {t('app.onboarding.productName')}
          </p>
          <p className="text-text-tertiary mt-0.5 text-xs font-medium">
            {t('app.onboarding.tagline')}
          </p>
        </div>
      </header>

      <Card className="border-l-primary space-y-2 border-l-4 p-5">
        <h1 className="text-xl font-bold tracking-tight">{t('app.onboarding.hero.title')}</h1>
        <p className="text-text-secondary text-sm leading-6">
          {t('app.onboarding.hero.description')}
        </p>
      </Card>

      <section className="space-y-2.5" aria-labelledby="onboarding-not-provided-heading">
        <h2
          id="onboarding-not-provided-heading"
          className="text-text-tertiary px-0.5 text-xs font-bold tracking-wider"
        >
          {t('app.onboarding.notProvided.heading')}
        </h2>
        <OnboardingCapabilityList items={notProvidedItems} tone="notProvided" />
      </section>

      <section className="space-y-2.5" aria-labelledby="onboarding-provided-heading">
        <h2
          id="onboarding-provided-heading"
          className="text-primary px-0.5 text-xs font-bold tracking-wider"
        >
          {t('app.onboarding.provided.heading')}
        </h2>
        <OnboardingCapabilityList items={providedItems} tone="provided" />
      </section>

      <div className="space-y-3 pt-1">
        {/* STEP 9: 정책 안내를 확인하고 앱으로 이동하는 Link일 뿐, 동의 상태를 저장하거나 법적 동의 증적을 만들지 않는다. */}
        <Link className={cn(buttonVariants({ size: 'lg' }), 'w-full')} to={APP_ROUTE_PATHS.appHome}>
          {t('app.onboarding.cta')}
        </Link>
        <PolicyNotice className="justify-center text-center">
          <p>{t('app.onboarding.disclaimer')}</p>
        </PolicyNotice>
      </div>
    </main>
  );
}
