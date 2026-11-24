import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';

import { EmptyState } from '@/components/common/EmptyState';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { SectionHeader } from '@/components/ui/section-header';
import { TextField } from '@/components/ui/text-field';
import { APP_ROUTE_PATHS } from '@/constants/routes';
import { holdTransient, resolveTransient } from '@/lib/transientNavigation';
import { useTranslation } from '@/i18n/I18nContext';
import { formatLocalizedDate } from '@/lib/date';
import { JOURNAL_ENTRIES, type JournalEntry } from '@/mocks/journalEntries';

interface ReviewStartLocationState {
  prefill?: string;
}

const EXAMPLE_KEYS = ['etf', 'earnings', 'loss'] as const;

/**
 * 최근 기록(예시 데이터) 한 건. 배지·막대 없이 텍스트 메타 + divider 행으로 표시한다.
 * 비로그인 화면의 표시 전용이라 링크가 없다.
 */
function RecentRecordRow({ entry }: { entry: JournalEntry }) {
  const { t, locale } = useTranslation();
  const title =
    entry.type === 'investment' ? t(`app.journalList.subjects.${entry.subjectKey}`) : entry.title;
  const meta = [
    formatLocalizedDate(entry.recordedAt, locale),
    t(`recordTags.entryType.${entry.type}`),
    ...(entry.type === 'investment' ? [t(`recordTags.action.${entry.action}`)] : []),
  ].join(' · ');

  return (
    <li className="flex min-w-0 flex-col gap-1 py-4 first:pt-0 last:pb-0">
      <span className="type-content-title text-foreground wrap-anywhere break-keep">{title}</span>
      <span className="type-meta text-text-secondary">{meta}</span>
      <span className="type-supporting text-text-secondary wrap-anywhere break-keep">
        {entry.question}
      </span>
      <p className="type-supporting text-text-body line-clamp-2 wrap-anywhere break-keep">
        {entry.memo}
      </p>
    </li>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const locationState =
    resolveTransient<ReviewStartLocationState>(location.state) ??
    (location.state as ReviewStartLocationState | null);
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
    const ref = holdTransient(trimmedQuestion);
    navigate(`${APP_ROUTE_PATHS.ask}?ref=${encodeURIComponent(ref)}`, {
      state: { reviewFlow: 'loading' },
    });
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
    <div className="flex min-h-full min-w-0 flex-col gap-8 px-5 pt-6 pb-10 sm:px-6 sm:pt-8">
      <header className="flex min-w-0 flex-col gap-2">
        <h1 className="type-page-title text-foreground wrap-anywhere break-keep">
          {t('app.home.hero.heading')}
        </h1>
        <p className="type-body text-text-secondary break-keep">{t('app.home.hero.description')}</p>
      </header>

      <Card className="min-w-0 p-5 sm:p-6">
        <form className="flex min-w-0 flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <p className="type-supporting text-text-secondary break-keep">
            {t('app.home.question.exampleNotice')}
          </p>
          <TextField
            multiline
            id="review-question"
            name="question"
            rows={4}
            label={t('app.home.question.label')}
            value={question}
            onChange={(event) => handleQuestionChange(event.target.value)}
            onKeyDown={handleQuestionKeyDown}
            placeholder={t('app.home.question.placeholder')}
            hint={t('app.home.question.helper')}
            error={hasValidationError ? t('app.home.question.required') : undefined}
          />
          <Button type="submit" className="w-full sm:w-auto sm:self-end">
            {t('app.home.question.submit')}
            <ArrowRight aria-hidden="true" />
          </Button>
          {/* Light에서 inset=page 동색이라 page 위에서는 면이 안 보인다. 카드(흰) 안에 둔다. */}
          <Notice>
            <p>{t('app.home.policyNotice')}</p>
          </Notice>
        </form>
      </Card>

      <section className="flex min-w-0 flex-col gap-1" aria-label={t('app.home.examples.heading')}>
        <SectionHeader title={t('app.home.examples.heading')} />
        <ul className="divide-border -mx-3 divide-y">
          {EXAMPLE_KEYS.map((key) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => startReview(t(`app.home.examples.items.${key}`))}
                className="type-body text-foreground hover:bg-control rounded-inset min-h-14 w-full px-3 py-3 text-left break-keep transition-colors"
              >
                {t(`app.home.examples.items.${key}`)}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="flex min-w-0 flex-col gap-1"
        aria-label={t('app.home.recentRecords.heading')}
      >
        <SectionHeader
          title={t('app.home.recentRecords.heading')}
          action={
            recentEntries.length > 0 ? (
              <Link
                to={APP_ROUTE_PATHS.journalList}
                className={buttonVariants({ variant: 'text', size: 'sm' })}
              >
                {t('app.home.recentRecords.viewAll')}
              </Link>
            ) : undefined
          }
        />

        {recentEntries.length > 0 ? (
          <>
            <p className="type-supporting text-text-secondary pb-3">
              {t('app.home.recentRecords.sampleNotice')}
            </p>
            <Card className="min-w-0 p-5">
              <ul className="divide-border flex min-w-0 flex-col divide-y">
                {recentEntries.map((entry) => (
                  <RecentRecordRow key={entry.id} entry={entry} />
                ))}
              </ul>
            </Card>
          </>
        ) : (
          <Card>
            <EmptyState
              title={t('app.home.empty.title')}
              description={t('app.home.empty.description')}
              action={
                <Button type="button" variant="text" onClick={() => startReview()}>
                  {t('app.home.empty.action')}
                </Button>
              }
            />
          </Card>
        )}
      </section>
    </div>
  );
}
