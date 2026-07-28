import { Link, useSearchParams } from 'react-router';

import { EmptyState } from '@/components/common/EmptyState';
import { PolicyNotice } from '@/components/common/PolicyNotice';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { APP_ROUTE_PATHS, buildAppJournalNewPath } from '@/constants/routes';
import type { MessageKey } from '@/i18n/dictionary';
import { useTranslation } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';

const PERSPECTIVE_KEYS: MessageKey[] = [
  'app.ask.perspectives.items.businessContext',
  'app.ask.perspectives.items.industryTrends',
  'app.ask.perspectives.items.earningsAssumptions',
  'app.ask.perspectives.items.pricedInExpectations',
  'app.ask.perspectives.items.currencyAndRates',
  'app.ask.perspectives.items.biasAndCounterEvidence',
];

const CHECKLIST_KEYS: Array<{ title: MessageKey; description: MessageKey }> = [
  {
    title: 'app.ask.checklist.items.businessContext.title',
    description: 'app.ask.checklist.items.businessContext.description',
  },
  {
    title: 'app.ask.checklist.items.industryTrends.title',
    description: 'app.ask.checklist.items.industryTrends.description',
  },
  {
    title: 'app.ask.checklist.items.earningsAssumptions.title',
    description: 'app.ask.checklist.items.earningsAssumptions.description',
  },
  {
    title: 'app.ask.checklist.items.pricedInExpectations.title',
    description: 'app.ask.checklist.items.pricedInExpectations.description',
  },
  {
    title: 'app.ask.checklist.items.currencyAndRates.title',
    description: 'app.ask.checklist.items.currencyAndRates.description',
  },
  {
    title: 'app.ask.checklist.items.biasAndCounterEvidence.title',
    description: 'app.ask.checklist.items.biasAndCounterEvidence.description',
  },
];

const RECORD_QUESTION_KEYS: MessageKey[] = [
  'app.ask.recordQuestions.items.businessAssumption',
  'app.ask.recordQuestions.items.evidenceToCheck',
  'app.ask.recordQuestions.items.counterEvidence',
];

export function AskPage() {
  const [searchParams] = useSearchParams();
  const question = (searchParams.get('q') ?? '').trim();
  const { t } = useTranslation();

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 px-5 pt-4 pb-8">
      <header className="relative flex min-h-11 items-center justify-center">
        <Link
          aria-label={t('app.ask.header.backLabel')}
          className="text-text-secondary absolute left-0 flex size-11 items-center justify-center rounded-md text-xl font-semibold"
          to={APP_ROUTE_PATHS.appHome}
        >
          <span aria-hidden="true">←</span>
        </Link>
        <h1 className="text-base font-bold">{t('app.ask.header.title')}</h1>
      </header>

      {question === '' ? (
        <Card className="p-2">
          <EmptyState
            icon={<span className="text-primary text-2xl">?</span>}
            title={t('app.ask.empty.title')}
            description={t('app.ask.empty.description')}
            action={
              <Link
                className={cn(buttonVariants({ variant: 'default' }), 'mt-2')}
                to={APP_ROUTE_PATHS.appHome}
              >
                {t('app.ask.empty.cta')}
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <section className="space-y-2" aria-labelledby="ask-question-heading">
            <h2
              id="ask-question-heading"
              className="text-text-tertiary text-xs font-bold tracking-wider"
            >
              {t('app.ask.questionLabel')}
            </h2>
            <Card className="border-l-primary border-l-4 p-4">
              <p className="min-w-0 text-xl leading-7 font-bold [overflow-wrap:anywhere]">
                {question}
              </p>
            </Card>
          </section>

          <section className="space-y-3" aria-labelledby="ask-perspectives-heading">
            <h2 id="ask-perspectives-heading" className="text-text-secondary text-sm font-semibold">
              {t('app.ask.perspectives.heading')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {PERSPECTIVE_KEYS.map((key) => (
                <Badge key={key} tone="info">
                  {t(key)}
                </Badge>
              ))}
            </div>
            <PolicyNotice>
              <p>{t('app.ask.fixtureNotice')}</p>
            </PolicyNotice>
          </section>

          <section className="space-y-3" aria-labelledby="ask-checklist-heading">
            <div className="flex items-center justify-between gap-3">
              <h2 id="ask-checklist-heading" className="text-base font-bold">
                {t('app.ask.checklist.heading')}
              </h2>
              <Badge>{t('app.ask.checklist.count')}</Badge>
            </div>
            <Card>
              <ul className="divide-border divide-y">
                {CHECKLIST_KEYS.map((item, index) => (
                  <li className="flex gap-3 p-4" key={item.title}>
                    <span
                      aria-hidden="true"
                      className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-md text-sm font-bold"
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold">{t(item.title)}</p>
                      <p className="text-text-secondary text-sm leading-6">{t(item.description)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          <section className="space-y-3" aria-labelledby="ask-record-questions-heading">
            <h2 id="ask-record-questions-heading" className="text-base font-bold">
              {t('app.ask.recordQuestions.heading')}
            </h2>
            <ul className="space-y-2">
              {RECORD_QUESTION_KEYS.map((key) => (
                <li
                  className="border-border bg-card flex gap-3 rounded-md border p-4 text-sm leading-6"
                  key={key}
                >
                  <span aria-hidden="true" className="text-primary text-xl leading-5">
                    “
                  </span>
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </section>

          <nav className="grid grid-cols-2 gap-2" aria-label={t('app.ask.header.title')}>
            <Link
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'h-auto min-h-[50px] text-center whitespace-normal',
              )}
              to={buildAppJournalNewPath('study')}
            >
              {t('app.ask.navigation.studyNote')}
            </Link>
            <Link
              className={cn(
                buttonVariants({ variant: 'default' }),
                'h-auto min-h-[50px] text-center whitespace-normal',
              )}
              to={buildAppJournalNewPath('investment')}
            >
              {t('app.ask.navigation.investmentRecord')}
            </Link>
            <Link
              className={cn(
                buttonVariants({ variant: 'secondary' }),
                'col-span-2 h-auto min-h-[50px] text-center whitespace-normal',
              )}
              to={APP_ROUTE_PATHS.appHome}
            >
              {t('app.ask.navigation.askAgain')}
            </Link>
          </nav>
        </>
      )}
    </div>
  );
}
