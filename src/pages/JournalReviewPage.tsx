import { Link, useParams } from 'react-router';

import { EmptyState } from '@/components/common/EmptyState';
import { PolicyNotice } from '@/components/common/PolicyNotice';
import { RecordTagBadge } from '@/components/common/RecordTagBadge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { APP_ROUTE_PATHS, buildAppJournalDetailPath } from '@/constants/routes';
import { useTranslation } from '@/i18n/I18nContext';
import { formatLocalizedDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import {
  JOURNAL_ENTRIES,
  type JournalChecklistItem,
  type JournalEntry,
} from '@/mocks/journalEntries';

interface ReviewHeaderProps {
  title: string;
  backLabel: string;
  backTo: string;
}

function ReviewHeader({ title, backLabel, backTo }: ReviewHeaderProps) {
  return (
    <header className="relative flex min-h-11 items-center justify-center">
      <Link
        aria-label={backLabel}
        className="text-text-secondary focus-visible:ring-ring/50 absolute left-0 flex size-11 items-center justify-center rounded-md text-xl font-semibold outline-none focus-visible:ring-3"
        to={backTo}
      >
        <span aria-hidden="true">←</span>
      </Link>
      <h1 className="text-base font-bold">{title}</h1>
    </header>
  );
}

function ReviewSummary({ entry }: { entry: JournalEntry }) {
  const { t, locale } = useTranslation();
  const heading =
    entry.type === 'investment' ? t(`app.journalList.subjects.${entry.subjectKey}`) : entry.title;

  return (
    <Card className="space-y-4 p-5">
      <p className="min-w-0 text-xl font-extrabold tracking-tight [overflow-wrap:anywhere]">
        {heading}
      </p>
      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 text-sm">
        <dt className="text-muted-foreground">{t('app.journalReview.metadata.recordType')}</dt>
        <dd className="justify-self-end">
          <RecordTagBadge kind="entryType" value={entry.type} />
        </dd>
        <dt className="text-muted-foreground">{t('app.journalReview.metadata.recordedAt')}</dt>
        <dd className="text-right font-medium">
          <time dateTime={entry.recordedAt}>{formatLocalizedDate(entry.recordedAt, locale)}</time>
        </dd>
        {entry.type === 'investment' && (
          <>
            <dt className="text-muted-foreground">{t('app.journalReview.metadata.pastAction')}</dt>
            <dd className="justify-self-end">
              <RecordTagBadge kind="action" value={entry.action} />
            </dd>
            {entry.emotion && (
              <>
                <dt className="text-muted-foreground">
                  {t('app.journalReview.metadata.pastEmotion')}
                </dt>
                <dd className="justify-self-end">
                  <RecordTagBadge kind="emotion" value={entry.emotion} />
                </dd>
              </>
            )}
          </>
        )}
      </dl>
    </Card>
  );
}

interface StatusListProps {
  items: JournalChecklistItem[];
  checkedLabel: string;
  uncheckedLabel: string;
}

function StatusList({ items, checkedLabel, uncheckedLabel }: StatusListProps) {
  return (
    <Card>
      <ul className="divide-border divide-y">
        {items.map((item, index) => {
          const statusLabel = item.checked ? checkedLabel : uncheckedLabel;
          return (
            <li className="flex min-w-0 items-start gap-3 p-4" key={`${index}-${item.text}`}>
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold',
                  item.checked
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted text-muted-foreground',
                )}
              >
                {item.checked ? '✓' : '—'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm leading-6 [overflow-wrap:anywhere]">
                  {item.text}
                </span>
                <span className="text-muted-foreground mt-1 block text-xs">{statusLabel}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function ReflectionPromptList({ prompts }: { prompts: string[] }) {
  return (
    <Card>
      <ul className="divide-border divide-y">
        {prompts.map((prompt, index) => (
          <li className="flex min-w-0 items-start gap-3 p-4" key={prompt}>
            <span
              aria-hidden="true"
              className="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            >
              {index + 1}
            </span>
            <span className="min-w-0 text-sm leading-6 [overflow-wrap:anywhere]">{prompt}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function JournalReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const entry = JOURNAL_ENTRIES.find((item) => item.id === id);

  if (!entry) {
    return (
      <main className="flex w-full min-w-0 flex-col gap-6 px-5 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <ReviewHeader
          title={t('app.journalReview.notFound.heading')}
          backLabel={t('app.journalReview.notFound.listAction')}
          backTo={APP_ROUTE_PATHS.journalList}
        />
        <Card className="p-2">
          <EmptyState
            title={t('app.journalReview.notFound.description')}
            action={
              <Link
                className={cn(buttonVariants({ variant: 'default' }), 'mt-2 min-h-11')}
                to={APP_ROUTE_PATHS.journalList}
              >
                {t('app.journalReview.notFound.listAction')}
              </Link>
            }
          />
        </Card>
      </main>
    );
  }

  const detailPath = buildAppJournalDetailPath(entry.id);
  const checkedLabel = t('app.journalReview.status.checked');
  const uncheckedLabel = t('app.journalReview.status.unchecked');

  return (
    <main className="flex w-full min-w-0 flex-col gap-6 px-5 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <ReviewHeader
        title={t('app.journalReview.headerTitle')}
        backLabel={t('app.journalReview.backLabel')}
        backTo={detailPath}
      />

      <section className="space-y-2" aria-labelledby="journal-review-summary">
        <h2
          id="journal-review-summary"
          className="text-text-tertiary text-xs font-bold tracking-wider"
        >
          {t('app.journalReview.summary.heading')}
        </h2>
        <ReviewSummary entry={entry} />
      </section>

      {entry.type === 'investment' ? (
        <>
          <section className="space-y-2" aria-labelledby="journal-review-investment-question">
            <h2 id="journal-review-investment-question" className="text-base font-bold">
              {t('app.journalReview.investment.questionHeading')}
            </h2>
            <Card className="border-l-primary border-l-4 p-4">
              <p className="min-w-0 text-lg leading-7 font-semibold [overflow-wrap:anywhere]">
                {entry.question}
              </p>
            </Card>
          </section>

          <section className="space-y-2" aria-labelledby="journal-review-investment-memo">
            <h2 id="journal-review-investment-memo" className="text-base font-bold">
              {t('app.journalReview.investment.memoHeading')}
            </h2>
            <Card className="p-4">
              <p className="min-w-0 text-sm leading-7 [overflow-wrap:anywhere]">{entry.memo}</p>
            </Card>
          </section>

          <section className="space-y-3" aria-labelledby="journal-review-investment-status">
            <h2 id="journal-review-investment-status" className="text-base font-bold">
              {t('app.journalReview.investment.statusHeading')}
            </h2>
            <StatusList
              items={entry.decisionChecks}
              checkedLabel={checkedLabel}
              uncheckedLabel={uncheckedLabel}
            />
          </section>
        </>
      ) : (
        <>
          <section className="space-y-2" aria-labelledby="journal-review-study-question">
            <h2 id="journal-review-study-question" className="text-base font-bold">
              {t('app.journalReview.study.questionHeading')}
            </h2>
            <Card className="border-l-muted-foreground border-l-4 p-4">
              <p className="min-w-0 text-lg leading-7 font-semibold [overflow-wrap:anywhere]">
                {entry.question}
              </p>
            </Card>
          </section>

          <section className="space-y-2" aria-labelledby="journal-review-study-memo">
            <h2 id="journal-review-study-memo" className="text-base font-bold">
              {t('app.journalReview.study.memoHeading')}
            </h2>
            <Card className="p-4">
              <p className="min-w-0 text-sm leading-7 [overflow-wrap:anywhere]">{entry.memo}</p>
            </Card>
          </section>

          <section className="space-y-3" aria-labelledby="journal-review-study-status">
            <h2 id="journal-review-study-status" className="text-base font-bold">
              {t('app.journalReview.study.statusHeading')}
            </h2>
            <StatusList
              items={entry.nextChecks}
              checkedLabel={checkedLabel}
              uncheckedLabel={uncheckedLabel}
            />
          </section>
        </>
      )}

      <PolicyNotice>{t('app.journalReview.policyNotice')}</PolicyNotice>

      <section className="space-y-3" aria-labelledby="journal-review-reflection">
        <h2 id="journal-review-reflection" className="text-base font-bold">
          {entry.type === 'investment'
            ? t('app.journalReview.investment.reflectionHeading')
            : t('app.journalReview.study.reflectionHeading')}
        </h2>
        <ReflectionPromptList
          prompts={
            entry.type === 'investment'
              ? [
                  t('app.journalReview.investment.prompts.assumption'),
                  t('app.journalReview.investment.prompts.uncheckedImpact'),
                  t('app.journalReview.investment.prompts.counterEvidence'),
                  t('app.journalReview.investment.prompts.nextChecks'),
                ]
              : [
                  t('app.journalReview.study.prompts.understanding'),
                  t('app.journalReview.study.prompts.revisit'),
                  t('app.journalReview.study.prompts.nextQuestion'),
                ]
          }
        />
      </section>

      <nav aria-label={t('app.journalReview.navigation.detail')}>
        <Link
          className={cn(buttonVariants({ size: 'lg' }), 'w-full [overflow-wrap:anywhere]')}
          to={detailPath}
        >
          {t('app.journalReview.navigation.detail')}
        </Link>
      </nav>
    </main>
  );
}
