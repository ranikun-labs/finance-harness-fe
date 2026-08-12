import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';

import { EmptyState } from '@/components/common/EmptyState';
import { PolicyNotice } from '@/components/common/PolicyNotice';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { APP_ROUTE_PATHS, buildAppJournalNewPath } from '@/constants/routes';
import { useTranslation } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { createDecisionContextSnapshot } from '@/mocks/decisionContext';
import { createReviewJournalHandoff, getReviewFixture, localize } from '@/mocks/reviewResult';

type ReviewPhase = 'loading' | 'result' | 'error';

interface ReviewLocationState {
  reviewFlow?: 'loading';
}

function formatReviewTime(value: string, locale: 'ko' | 'en'): string {
  return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value));
}

function LoadingReview({ question }: { question: string }) {
  const { t } = useTranslation();
  const steps = [
    t('app.ask.loading.steps.question'),
    t('app.ask.loading.steps.evidence'),
    t('app.ask.loading.steps.unknown'),
  ];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header className="flex min-w-0 flex-col gap-2">
        <p className="text-primary text-xs font-bold tracking-wider uppercase">
          {t('app.ask.loading.eyebrow')}
        </p>
        <h1 className="text-2xl leading-tight font-extrabold tracking-tight">
          {t('app.ask.loading.title')}
        </h1>
        <p className="text-muted-foreground text-sm leading-6">
          {t('app.ask.loading.description')}
        </p>
      </header>

      <section aria-labelledby="loading-question-heading" className="space-y-2">
        <h2
          id="loading-question-heading"
          className="text-text-tertiary text-xs font-bold tracking-wider"
        >
          {t('app.ask.structured.questionLabel')}
        </h2>
        <Card className="border-l-primary border-l-4 p-4">
          <p className="min-w-0 text-lg leading-7 font-bold [overflow-wrap:anywhere]">{question}</p>
        </Card>
      </section>

      <section
        aria-label={t('app.ask.loading.title')}
        aria-live="polite"
        role="status"
        className="border-border bg-card flex min-w-0 flex-col gap-4 rounded-xl border p-5"
      >
        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
          <div className="bg-primary h-full w-2/3 animate-pulse rounded-full" />
        </div>
        <ol className="flex min-w-0 flex-col gap-3">
          {steps.map((step, index) => (
            <li key={step} className="flex min-w-0 items-start gap-3 text-sm leading-6">
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  index === 0
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {index + 1}
              </span>
              <span className={cn(index === 0 ? 'font-semibold' : 'text-muted-foreground')}>
                {step}
              </span>
            </li>
          ))}
        </ol>
        <PolicyNotice>
          <p>{t('app.ask.loading.provenance')}</p>
        </PolicyNotice>
      </section>
    </div>
  );
}

function ReviewError({
  question,
  onRetry,
  onEdit,
}: {
  question: string;
  onRetry: () => void;
  onEdit: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header className="flex min-w-0 flex-col gap-2">
        <p className="text-destructive text-xs font-bold tracking-wider uppercase">
          {t('app.ask.header.title')}
        </p>
        <h1 className="text-2xl leading-tight font-extrabold tracking-tight">
          {t('app.ask.error.title')}
        </h1>
      </header>

      <section aria-labelledby="error-question-heading" className="space-y-2">
        <h2
          id="error-question-heading"
          className="text-text-tertiary text-xs font-bold tracking-wider"
        >
          {t('app.ask.structured.questionLabel')}
        </h2>
        <Card className="border-l-primary border-l-4 p-4">
          <p className="min-w-0 text-lg leading-7 font-bold [overflow-wrap:anywhere]">{question}</p>
        </Card>
      </section>

      <Card role="alert" className="border-destructive/30 bg-destructive/5 flex flex-col gap-3 p-5">
        <p className="text-destructive text-sm leading-6">{t('app.ask.error.description')}</p>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onRetry}
            className={cn(buttonVariants(), 'min-h-11 flex-1')}
          >
            {t('app.ask.error.retry')}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11 flex-1')}
          >
            {t('app.ask.error.edit')}
          </button>
        </div>
      </Card>
    </div>
  );
}

function StructuredReviewResult({
  question,
  partial,
  returnTarget,
}: {
  question: string;
  partial: boolean;
  returnTarget: string;
}) {
  const { locale, t } = useTranslation();
  const fixture = useMemo(() => getReviewFixture(partial), [partial]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(fixture.checklist.map((item) => [item.id, item.checked])),
  );
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const decisionContext = useMemo(
    () => createDecisionContextSnapshot(question, fixture, checkedItems),
    [checkedItems, fixture, question],
  );
  const formattedGeneratedAt = formatReviewTime(fixture.generatedAt, locale);
  const formattedReviewedAt = formatReviewTime(fixture.reviewedAt, locale);

  function toggleChecklistItem(id: string) {
    setCheckedItems((current) => ({ ...current, [id]: !current[id] }));
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-primary text-xs font-bold tracking-wider uppercase">
            {t('app.ask.header.title')}
          </p>
          <h1 className="min-w-0 text-2xl leading-tight font-extrabold tracking-tight">
            {t('app.ask.structured.resultTitle')}
          </h1>
        </div>
        <Badge tone="info">{t('app.ask.structured.fixtureLabel')}</Badge>
      </header>

      <section aria-labelledby="result-question-heading" className="space-y-2">
        <h2
          id="result-question-heading"
          className="text-text-tertiary text-xs font-bold tracking-wider"
        >
          {t('app.ask.structured.questionLabel')}
        </h2>
        <Card className="border-l-primary border-l-4 p-4">
          <p className="min-w-0 text-xl leading-7 font-bold [overflow-wrap:anywhere]">{question}</p>
        </Card>
      </section>

      {partial && (
        <section
          role="status"
          aria-live="polite"
          className="border-border bg-muted/50 flex min-w-0 flex-col gap-1 rounded-xl border p-4"
        >
          <h2 className="text-base font-bold">{t('app.ask.structured.partialTitle')}</h2>
          <p className="text-muted-foreground text-sm leading-6">
            {t('app.ask.structured.partialDescription')}
          </p>
          <p className="text-muted-foreground text-xs leading-5">
            {t('app.ask.structured.partialNarrow')}
          </p>
        </section>
      )}

      <section aria-labelledby="review-checklist-heading" className="flex min-w-0 flex-col gap-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2 id="review-checklist-heading" className="text-base font-bold">
              {t('app.ask.structured.checklist.heading')}
            </h2>
            <p className="text-muted-foreground text-sm leading-5">
              {t('app.ask.structured.checklist.helper')}
            </p>
          </div>
          <Badge>
            {t('app.ask.structured.checklist.progress', {
              checked: String(checkedCount),
              total: String(fixture.checklist.length),
            })}
          </Badge>
        </div>
        <Card>
          <ul className="divide-border divide-y">
            {fixture.checklist.map((item, index) => {
              const checked = Boolean(checkedItems[item.id]);
              return (
                <li key={item.id} className="min-w-0 p-3">
                  <button
                    type="button"
                    aria-pressed={checked}
                    onClick={() => toggleChecklistItem(item.id)}
                    className="focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-11 w-full min-w-0 items-start gap-3 rounded-lg text-left outline-none focus-visible:ring-3"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-md text-sm font-bold',
                        checked
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {checked ? '✓' : index + 1}
                    </span>
                    <span
                      className={cn('min-w-0 pt-1 text-sm leading-6', checked && 'font-semibold')}
                    >
                      {localize(item.title, locale)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      <section aria-labelledby="review-facts-heading" className="flex min-w-0 flex-col gap-3">
        <div className="space-y-1">
          <h2 id="review-facts-heading" className="text-base font-bold">
            {t('app.ask.structured.fact.heading')}
          </h2>
          <p className="text-muted-foreground text-sm leading-5">
            {t('app.ask.structured.fact.helper')}
          </p>
        </div>
        <ul className="flex min-w-0 flex-col gap-3">
          {fixture.facts.map((fact) => (
            <li key={fact.id} className="min-w-0">
              <Card className="flex min-w-0 flex-col gap-3 p-4">
                <p className="min-w-0 text-sm leading-6 font-semibold [overflow-wrap:anywhere]">
                  {localize(fact.claim, locale)}
                </p>
                <dl className="text-muted-foreground grid min-w-0 gap-2 text-xs leading-5 sm:grid-cols-2">
                  <div className="min-w-0">
                    <dt className="font-semibold">{t('app.ask.structured.fact.sourceLabel')}</dt>
                    <dd className="[overflow-wrap:anywhere]">{localize(fact.source, locale)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">{t('app.ask.structured.fact.asOfLabel')}</dt>
                    <dd>
                      <time dateTime={fact.asOf}>{fact.asOf}</time>
                    </dd>
                  </div>
                </dl>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {fixture.inferences.length > 0 && (
        <section aria-labelledby="review-inference-heading" className="flex min-w-0 flex-col gap-3">
          <div className="space-y-1">
            <h2 id="review-inference-heading" className="text-base font-bold">
              {t('app.ask.structured.inference.heading')}
            </h2>
            <p className="text-muted-foreground text-sm leading-5">
              {t('app.ask.structured.inference.helper')}
            </p>
          </div>
          <ul className="flex min-w-0 flex-col gap-3">
            {fixture.inferences.map((inference) => (
              <li key={inference.id} className="min-w-0">
                <Card className="border-primary/20 bg-primary/5 flex min-w-0 flex-col gap-3 p-4">
                  <p className="min-w-0 text-sm leading-6 [overflow-wrap:anywhere]">
                    {localize(inference.text, locale)}
                  </p>
                  <p className="text-muted-foreground text-xs leading-5">
                    <span className="font-semibold">
                      {t('app.ask.structured.inference.basisLabel')}:
                    </span>{' '}
                    {localize(inference.basis, locale)}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="review-unknown-heading" className="flex min-w-0 flex-col gap-3">
        <div className="space-y-1">
          <h2 id="review-unknown-heading" className="text-base font-bold">
            {t('app.ask.structured.unknown.heading')}
          </h2>
          <p className="text-muted-foreground text-sm leading-5">
            {t('app.ask.structured.unknown.helper')}
          </p>
        </div>
        <ul className="flex min-w-0 flex-col gap-3">
          {fixture.unknowns.map((unknown) => (
            <li key={unknown.id} className="min-w-0">
              <Card className="flex min-w-0 flex-col gap-2 p-4">
                <Badge tone="neutral">{localize(unknown.tag, locale)}</Badge>
                <p className="min-w-0 text-sm leading-6 [overflow-wrap:anywhere]">
                  {localize(unknown.text, locale)}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="review-time-heading" className="flex min-w-0 flex-col gap-3">
        <h2 id="review-time-heading" className="text-base font-bold">
          {t('app.ask.structured.timestampsHeading')}
        </h2>
        <dl className="text-muted-foreground grid gap-2 text-xs leading-5 sm:grid-cols-2">
          <div>
            <dt className="font-semibold">
              {t('app.ask.structured.generatedAt', { timestamp: '' }).trim()}
            </dt>
            <dd>
              <time dateTime={fixture.generatedAt}>{formattedGeneratedAt}</time>
            </dd>
          </div>
          <div>
            <dt className="font-semibold">
              {t('app.ask.structured.reviewedAt', { timestamp: '' }).trim()}
            </dt>
            <dd>
              <time dateTime={fixture.reviewedAt}>{formattedReviewedAt}</time>
            </dd>
          </div>
        </dl>
        <PolicyNotice>
          <p>{t('app.ask.structured.provenance')}</p>
        </PolicyNotice>
      </section>

      <section
        aria-labelledby="review-handoff-heading"
        className="border-border bg-card flex min-w-0 flex-col gap-4 rounded-xl border p-5"
      >
        <header className="flex min-w-0 flex-col gap-1">
          <h2 id="review-handoff-heading" className="text-base font-bold">
            {t('app.ask.handoff.heading')}
          </h2>
          <p className="text-muted-foreground text-sm leading-6">
            {t('app.ask.handoff.description')}
          </p>
        </header>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <Link
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'h-auto min-h-24 flex-col items-start gap-1 p-4 text-left whitespace-normal',
            )}
            to={buildAppJournalNewPath('investment')}
            state={{
              reviewHandoff: createReviewJournalHandoff(
                'investment',
                question,
                fixture,
                locale,
                returnTarget,
              ),
              decisionContext,
            }}
          >
            <span className="text-base font-semibold">{t('app.ask.handoff.investment.title')}</span>
            <span className="text-muted-foreground text-sm leading-5">
              {t('app.ask.handoff.investment.description')}
            </span>
          </Link>
          <Link
            className={cn(
              buttonVariants({ variant: 'default' }),
              'h-auto min-h-24 flex-col items-start gap-1 p-4 text-left whitespace-normal',
            )}
            to={buildAppJournalNewPath('study')}
            state={{
              reviewHandoff: createReviewJournalHandoff(
                'study',
                question,
                fixture,
                locale,
                returnTarget,
              ),
            }}
          >
            <span className="text-base font-semibold">{t('app.ask.handoff.study.title')}</span>
            <span className="text-primary-foreground/80 text-sm leading-5">
              {t('app.ask.handoff.study.description')}
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}

export function AskPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const question = (searchParams.get('q') ?? '').trim();
  const requestedFixture = searchParams.get('fixture');
  const returnTarget = `${location.pathname}${location.search}${location.hash}`;
  const locationState = location.state as ReviewLocationState | null;
  const [phase, setPhase] = useState<ReviewPhase>(() => {
    if (requestedFixture === 'error') return 'error';
    return locationState?.reviewFlow === 'loading' ? 'loading' : 'result';
  });
  const [partial, setPartial] = useState(requestedFixture === 'partial');

  useEffect(() => {
    if (phase !== 'loading') return undefined;
    const timer = window.setTimeout(() => {
      setPartial(requestedFixture === 'partial');
      setPhase('result');
    }, 550);
    return () => window.clearTimeout(timer);
  }, [phase, requestedFixture]);

  function retryReview() {
    setPartial(false);
    setPhase('loading');
  }

  function editQuestion() {
    navigate(APP_ROUTE_PATHS.appHome, { state: { prefill: question } });
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 px-5 pt-4 pb-8">
      <header className="relative flex min-h-11 items-center justify-center">
        <Link
          aria-label={t('app.ask.header.backLabel')}
          className="text-text-secondary focus-visible:ring-ring/50 absolute left-0 flex size-11 items-center justify-center rounded-md text-xl font-semibold outline-none focus-visible:ring-3"
          to={APP_ROUTE_PATHS.appHome}
        >
          <span aria-hidden="true">←</span>
        </Link>
        {question === '' ? (
          <h1 className="text-base font-bold">{t('app.ask.header.title')}</h1>
        ) : (
          <p className="text-base font-bold">{t('app.ask.header.title')}</p>
        )}
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
      ) : phase === 'loading' ? (
        <LoadingReview question={question} />
      ) : phase === 'error' ? (
        <ReviewError question={question} onRetry={retryReview} onEdit={editQuestion} />
      ) : (
        <StructuredReviewResult question={question} partial={partial} returnTarget={returnTarget} />
      )}
    </div>
  );
}
