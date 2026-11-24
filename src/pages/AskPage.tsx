import { LocalGeneralAnalysis } from '@/features/general-analysis/LocalGeneralAnalysis';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';

import { EmptyState } from '@/components/common/EmptyState';
import { PolicyNotice } from '@/components/common/PolicyNotice';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { AUTH_ROUTE_PATHS, APP_ROUTE_PATHS, buildAppJournalNewPath } from '@/constants/routes';
import { useAuthPresentation } from '@/features/auth/AuthPresentationContext';
import type { AuthResumeIntent } from '@/features/auth/authPresentation';
import { useTranslation } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import {
  readReviewChecks,
  readTransient,
  safeReviewReturn,
  transientState,
  writeReviewChecks,
} from '@/lib/transientNavigation';
import { createDecisionContextSnapshot } from '@/mocks/decisionContext';
import { createReviewJournalHandoff, getReviewFixture, localize } from '@/mocks/reviewResult';

type ReviewPhase = 'loading' | 'result' | 'error';

interface ReviewLocationState {
  reviewFlow?: 'loading';
  focusReviewHandoff?: 'investment' | 'study';
}

function formatReviewTime(value: string, locale: 'ko' | 'en'): string {
  return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value));
}

/** 기준일은 `YYYY.MM.DD`로 표시한다(ISO 문자열은 `dateTime` 속성에만 둔다). */
function formatAsOfDate(value: string): string {
  return value.replaceAll('-', '.');
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
        <Card className="p-5">
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
        <Card className="p-5">
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
  reviewRef,
  focusReviewHandoff,
}: {
  question: string;
  partial: boolean;
  returnTarget: string;
  reviewRef: string;
  focusReviewHandoff?: 'investment' | 'study';
}) {
  const { locale, t } = useTranslation();
  const navigate = useNavigate();
  const investmentLinkRef = useRef<HTMLAnchorElement>(null);
  const studyLinkRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (focusReviewHandoff === 'investment') investmentLinkRef.current?.focus();
    if (focusReviewHandoff === 'study') studyLinkRef.current?.focus();
  }, [focusReviewHandoff]);
  const { state: authPresentationState } = useAuthPresentation();
  const fixture = useMemo(() => getReviewFixture(partial), [partial]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(
    () =>
      readReviewChecks(reviewRef) ??
      Object.fromEntries(fixture.checklist.map((item) => [item.id, item.checked])),
  );
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const decisionContext = useMemo(
    () => createDecisionContextSnapshot(question, fixture, checkedItems),
    [checkedItems, fixture, question],
  );
  const investmentHandoff = useMemo(
    () => createReviewJournalHandoff('investment', question, fixture, locale, returnTarget),
    [fixture, locale, question, returnTarget],
  );
  const studyHandoff = useMemo(
    () => createReviewJournalHandoff('study', question, fixture, locale, returnTarget),
    [fixture, locale, question, returnTarget],
  );
  const investmentAuthIntent = {
    targetRoute: buildAppJournalNewPath('investment'),
    recordType: 'investment',
    returnTarget,
    reviewHandoff: investmentHandoff,
    decisionContext,
    decisionContextEnabled: true,
  } satisfies AuthResumeIntent;
  const studyAuthIntent = {
    targetRoute: buildAppJournalNewPath('study'),
    recordType: 'study',
    returnTarget,
    reviewHandoff: studyHandoff,
  } satisfies AuthResumeIntent;
  const investmentDestination =
    authPresentationState === 'authenticated'
      ? investmentAuthIntent.targetRoute
      : AUTH_ROUTE_PATHS.entry;
  const studyDestination =
    authPresentationState === 'authenticated'
      ? studyAuthIntent.targetRoute
      : AUTH_ROUTE_PATHS.entry;
  const investmentDestinationState =
    authPresentationState === 'authenticated'
      ? {
          reviewHandoff: investmentHandoff,
          decisionContext,
          decisionContextEnabled: true,
        }
      : { authResumeIntent: investmentAuthIntent };
  const studyDestinationState =
    authPresentationState === 'authenticated'
      ? { reviewHandoff: studyHandoff }
      : { authResumeIntent: studyAuthIntent };
  const formattedGeneratedAt = formatReviewTime(fixture.generatedAt, locale);
  const formattedReviewedAt = formatReviewTime(fixture.reviewedAt, locale);

  function toggleChecklistItem(id: string) {
    const next = { ...checkedItems, [id]: !checkedItems[id] };
    writeReviewChecks(reviewRef, next);
    setCheckedItems(next);
  }

  const investmentLinkProps = {
    to: investmentDestination,
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      event.preventDefault();
      navigate(investmentDestination, { state: transientState(investmentDestinationState) });
    },
  };

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header className="flex min-w-0 flex-col gap-2">
        <p className="type-meta text-text-secondary">
          {t('app.ask.structured.resultTitle')} · {t('app.ask.structured.fixtureLabel')}
        </p>
        <h1 className="type-page-title min-w-0 wrap-anywhere break-keep">{question}</h1>
      </header>

      {partial && (
        <Notice tone="warning" role="status" aria-live="polite">
          <h2 className="type-label">{t('app.ask.structured.partialTitle')}</h2>
          <p>{t('app.ask.structured.partialDescription')}</p>
          <p className="text-text-secondary">{t('app.ask.structured.partialNarrow')}</p>
        </Notice>
      )}

      <section aria-labelledby="review-checklist-heading" className="flex min-w-0 flex-col gap-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2 id="review-checklist-heading" className="type-section-title">
              {t('app.ask.structured.checklist.heading')}
            </h2>
            <p className="type-supporting text-text-secondary">
              {t('app.ask.structured.checklist.helper')}
            </p>
          </div>
          <span className="type-meta text-text-secondary shrink-0" aria-live="polite">
            {t('app.ask.structured.checklist.progress', {
              checked: String(checkedCount),
              total: String(fixture.checklist.length),
            })}
          </span>
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
          <h2 id="review-facts-heading" className="type-section-title">
            {t('app.ask.structured.fact.heading')}
          </h2>
          <p className="type-supporting text-text-secondary">
            {t('app.ask.structured.fact.helper')}
          </p>
        </div>
        <Card>
          <ul className="divide-border divide-y">
            {fixture.facts.map((fact) => (
              <li key={fact.id} className="flex min-w-0 flex-col gap-2 p-4">
                <p className="type-body min-w-0 font-semibold wrap-anywhere">
                  {localize(fact.claim, locale)}
                </p>
                <dl className="type-meta text-text-secondary grid min-w-0 gap-x-4 gap-y-1 sm:grid-cols-2">
                  <div className="min-w-0">
                    <dt className="font-semibold">{t('app.ask.structured.fact.sourceLabel')}</dt>
                    <dd className="wrap-anywhere">{localize(fact.source, locale)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">{t('app.ask.structured.fact.asOfLabel')}</dt>
                    <dd>
                      <time dateTime={fact.asOf}>{formatAsOfDate(fact.asOf)}</time>
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {fixture.inferences.length > 0 && (
        <section aria-labelledby="review-inference-heading" className="flex min-w-0 flex-col gap-3">
          <h2 id="review-inference-heading" className="type-section-title">
            {t('app.ask.structured.inference.heading')}
          </h2>
          <ul className="flex min-w-0 flex-col gap-3">
            {fixture.inferences.map((inference) => (
              <li key={inference.id} className="min-w-0">
                <Card className="flex min-w-0 flex-col gap-3 p-4">
                  <Badge tone="information">{t('app.ask.structured.inference.helper')}</Badge>
                  <p className="type-body min-w-0 wrap-anywhere">
                    {localize(inference.text, locale)}
                  </p>
                  <p className="type-meta text-text-secondary">
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
          <h2 id="review-unknown-heading" className="type-section-title">
            {t('app.ask.structured.unknown.heading')}
          </h2>
          <p className="type-supporting text-text-secondary">
            {t('app.ask.structured.unknown.helper')}
          </p>
        </div>
        <Card>
          <ul className="divide-border divide-y">
            {fixture.unknowns.map((unknown) => (
              <li key={unknown.id} className="flex min-w-0 flex-col gap-2 p-4">
                <Badge tone="neutral">{localize(unknown.tag, locale)}</Badge>
                <p className="type-body min-w-0 wrap-anywhere">{localize(unknown.text, locale)}</p>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section aria-labelledby="review-time-heading" className="flex min-w-0 flex-col gap-3">
        <h2 id="review-time-heading" className="type-section-title">
          {t('app.ask.structured.timestampsHeading')}
        </h2>
        <dl className="type-meta text-text-secondary grid gap-2 sm:grid-cols-2">
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
        <Card className="p-4">
          <Notice tone="neutral" className="p-0">
            <p>{t('app.ask.structured.provenance')}</p>
          </Notice>
        </Card>
      </section>

      <section aria-labelledby="review-handoff-heading" className="flex min-w-0 flex-col gap-3">
        <header className="flex min-w-0 flex-col gap-1">
          <h2 id="review-handoff-heading" className="type-section-title">
            {t('app.ask.handoff.heading')}
          </h2>
          <p className="type-supporting text-text-secondary">{t('app.ask.handoff.description')}</p>
        </header>
        <Card className="flex min-w-0 flex-col gap-1 p-4">
          <h3 className="type-content-title">{t('app.ask.handoff.investment.title')}</h3>
          <p className="type-supporting text-text-secondary">
            {t('app.ask.handoff.investment.description')}
          </p>
        </Card>
        <Card className="flex min-w-0 flex-col gap-3 p-4">
          <div className="flex flex-col gap-1">
            <h3 className="type-content-title">{t('app.ask.handoff.study.title')}</h3>
            <p className="type-supporting text-text-secondary">
              {t('app.ask.handoff.study.description')}
            </p>
          </div>
          <Link
            ref={studyLinkRef}
            className={cn(buttonVariants({ variant: 'subtle' }), 'w-full md:w-fit')}
            to={studyDestination}
            onClick={(event) => {
              if (
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              )
                return;
              event.preventDefault();
              navigate(studyDestination, { state: transientState(studyDestinationState) });
            }}
          >
            {t('app.ask.handoff.study.title')}
          </Link>
        </Card>
      </section>

      {/* 화면의 Strong 1개. 긴 결과를 끝까지 내리지 않아도 보이도록 하단에 붙인다(폰 전폭, 태블릿 이상 내용 폭). */}
      <div
        data-testid="review-primary-action"
        className="bg-background border-border sticky bottom-0 z-10 -mx-5 border-t px-5 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <Link
          ref={investmentLinkRef}
          className={cn(buttonVariants({ variant: 'strong' }), 'w-full md:w-fit')}
          {...investmentLinkProps}
        >
          {t('app.ask.handoff.investment.title')}
        </Link>
      </div>
    </div>
  );
}

export function AskPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const storedQuestion = readTransient<unknown>(searchParams.get('ref'));
  const question = typeof storedQuestion === 'string' ? storedQuestion.trim() : '';
  const requestedFixture = searchParams.get('fixture');
  const returnTarget = safeReviewReturn(`${location.pathname}${location.search}${location.hash}`);
  useEffect(() => {
    if (searchParams.has('q')) navigate(returnTarget, { replace: true });
  }, [navigate, returnTarget, searchParams]);
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
    navigate(APP_ROUTE_PATHS.appHome, { state: transientState({ prefill: question }) });
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

      {question !== '' &&
      import.meta.env.DEV &&
      import.meta.env.VITE_LOCAL_GENERAL_ANALYSIS === 'true' ? (
        <LocalGeneralAnalysis
          key={question}
          question={question}
          onEdit={editQuestion}
          httpSmoke={
            import.meta.env.DEV &&
            import.meta.env.VITE_LOCAL_GENERAL_ANALYSIS_HTTP_SMOKE === 'true' &&
            ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
          }
        />
      ) : question === '' ? (
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
        <StructuredReviewResult
          key={searchParams.get('ref')}
          question={question}
          partial={partial}
          returnTarget={returnTarget}
          reviewRef={searchParams.get('ref') ?? ''}
          focusReviewHandoff={locationState?.focusReviewHandoff}
        />
      )}
    </div>
  );
}
