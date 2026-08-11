import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';

import { EmptyState } from '@/components/common/EmptyState';
import { PolicyNotice } from '@/components/common/PolicyNotice';
import { JournalRecordCard } from '@/components/journal/JournalRecordCard';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { APP_ROUTE_PATHS, buildAppAskPath } from '@/constants/routes';
import { useTranslation } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { JOURNAL_ENTRIES } from '@/mocks/journalEntries';

interface ReviewStartLocationState {
  prefill?: string;
}

const EXAMPLE_KEYS = ['etf', 'earnings', 'loss'] as const;

export function HomePage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as ReviewStartLocationState | null;
  const [question, setQuestion] = useState(locationState?.prefill ?? '');
  const [hasValidationError, setHasValidationError] = useState(false);
  const recentEntries = [...JOURNAL_ENTRIES]
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))
    .slice(0, 2);

  function startReview(value = question) {
    const trimmedQuestion = value.trim();
    if (trimmedQuestion === '') {
      setHasValidationError(true);
      return;
    }

    setHasValidationError(false);
    navigate(buildAppAskPath(trimmedQuestion), { state: { reviewFlow: 'loading' } });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startReview();
  }

  function handleQuestionKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      startReview();
    }
  }

  function handleQuestionChange(value: string) {
    setQuestion(value);
    if (value.trim() !== '') setHasValidationError(false);
  }

  return (
    <div className="flex min-h-full min-w-0 flex-col gap-6 px-4 pt-5 pb-6">
      <header className="flex min-w-0 flex-col gap-3">
        <p className="text-primary text-xs font-bold tracking-wider uppercase">
          <span aria-hidden="true">✦ </span>
          {t('app.home.hero.eyebrow')}
        </p>
        <h1 className="text-foreground min-w-0 text-3xl leading-tight font-extrabold tracking-tight [overflow-wrap:anywhere]">
          {t('app.home.hero.heading')}
        </h1>
        <p className="text-muted-foreground min-w-0 text-sm leading-6 [overflow-wrap:anywhere]">
          {t('app.home.hero.description')}
        </p>
      </header>

      <Card className="border-primary/20 from-primary/10 via-card to-card min-w-0 rounded-3xl bg-gradient-to-br p-5 shadow-md">
        <form className="flex min-w-0 flex-col gap-3" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="review-question" className="text-base font-bold">
              {t('app.home.question.label')}
            </label>
            <textarea
              id="review-question"
              name="question"
              rows={4}
              value={question}
              onChange={(event) => handleQuestionChange(event.target.value)}
              onKeyDown={handleQuestionKeyDown}
              placeholder={t('app.home.question.placeholder')}
              aria-invalid={hasValidationError}
              aria-describedby={
                hasValidationError ? 'review-question-error' : 'review-question-help'
              }
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-32 w-full resize-y rounded-xl border px-4 py-3 text-base leading-6 outline-none focus-visible:ring-3"
            />
            <p id="review-question-help" className="text-muted-foreground text-sm leading-5">
              {t('app.home.question.helper')}
            </p>
            {hasValidationError && (
              <p
                id="review-question-error"
                role="alert"
                className="text-destructive text-sm font-semibold"
              >
                {t('app.home.question.required')}
              </p>
            )}
          </div>
          <button type="submit" className={cn(buttonVariants({ size: 'lg' }), 'min-h-12 w-full')}>
            {t('app.home.question.submit')}
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </Card>

      <section className="flex min-w-0 flex-col gap-3" aria-labelledby="review-examples-heading">
        <h2
          id="review-examples-heading"
          className="text-foreground text-lg font-bold tracking-tight"
        >
          {t('app.home.examples.heading')}
        </h2>
        <div className="flex min-w-0 flex-col gap-2">
          {EXAMPLE_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => startReview(t(`app.home.examples.items.${key}`))}
              className="border-border bg-card text-foreground hover:bg-accent focus-visible:border-ring focus-visible:ring-ring/50 min-h-11 w-full rounded-xl border px-4 py-3 text-left text-sm leading-5 transition-colors outline-none focus-visible:ring-3"
            >
              {t(`app.home.examples.items.${key}`)}
            </button>
          ))}
        </div>
      </section>

      <PolicyNotice>
        <p>{t('app.home.policyNotice')}</p>
      </PolicyNotice>

      <section className="flex min-w-0 flex-col gap-3" aria-labelledby="home-recent-records">
        <h2 id="home-recent-records" className="text-foreground text-lg font-bold tracking-tight">
          {t('app.home.recentRecords.heading')}
        </h2>

        {recentEntries.length > 0 ? (
          <>
            <ul className="flex min-w-0 flex-col gap-3">
              {recentEntries.map((entry) => (
                <li
                  key={entry.id}
                  className="[&_a]:focus-visible:ring-ring/50 min-w-0 [&_a]:rounded-lg [&_a]:outline-none [&_a]:focus-visible:ring-3 [&_p]:[overflow-wrap:anywhere] [&_span]:[overflow-wrap:anywhere]"
                >
                  <JournalRecordCard entry={entry} />
                </li>
              ))}
            </ul>

            <Link
              to={APP_ROUTE_PATHS.journalList}
              className={cn(buttonVariants({ variant: 'outline' }), 'mt-1 min-h-11 w-full')}
            >
              {t('app.home.recentRecords.viewAll')}
            </Link>
          </>
        ) : (
          <Card className="p-2">
            <EmptyState
              icon={<span className="text-2xl">◇</span>}
              title={t('app.home.empty.title')}
              description={t('app.home.empty.description')}
              action={
                <button
                  type="button"
                  onClick={() => startReview()}
                  className={cn(buttonVariants({ size: 'lg' }), 'mt-2 min-h-11')}
                >
                  {t('app.home.empty.action')}
                </button>
              }
            />
          </Card>
        )}
      </section>
    </div>
  );
}
