import { Link, useLocation, useParams } from 'react-router';

import { EmptyState } from '@/components/common/EmptyState';
import { DecisionContextSnapshotView } from '@/components/journal/DecisionContextPanel';
import { RecordTagBadge } from '@/components/common/RecordTagBadge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { APP_ROUTE_PATHS, buildAppJournalReviewPath } from '@/constants/routes';
import { useTranslation } from '@/i18n/I18nContext';
import { formatLocalizedDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { DecisionContextSnapshot } from '@/mocks/decisionContext';
import {
  JOURNAL_ENTRIES,
  type JournalChecklistItem,
  type JournalEntry,
} from '@/mocks/journalEntries';

interface StatusChecklistProps {
  items: JournalChecklistItem[];
  checkedLabel: string;
  uncheckedLabel: string;
}

interface JournalDetailLocationState {
  decisionContext?: DecisionContextSnapshot;
}

function StatusChecklist({ items, checkedLabel, uncheckedLabel }: StatusChecklistProps) {
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

function NumberedChecklist({ items }: { items: string[] }) {
  return (
    <Card>
      <ul className="divide-border divide-y">
        {items.map((item, index) => (
          <li className="flex min-w-0 items-start gap-3 p-4" key={`${index}-${item}`}>
            <span
              aria-hidden="true"
              className="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold"
            >
              {index + 1}
            </span>
            <span className="min-w-0 text-sm leading-6 [overflow-wrap:anywhere]">{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function DetailHeader({ title, backLabel }: { title: string; backLabel: string }) {
  return (
    <header className="relative flex min-h-11 items-center justify-center">
      <Link
        aria-label={backLabel}
        className="text-text-secondary focus-visible:ring-ring/50 absolute left-0 flex size-11 items-center justify-center rounded-md text-xl font-semibold outline-none focus-visible:ring-3"
        to={APP_ROUTE_PATHS.journalList}
      >
        <span aria-hidden="true">←</span>
      </Link>
      <h1 className="text-base font-bold">{title}</h1>
    </header>
  );
}

function EntrySummary({ entry }: { entry: JournalEntry }) {
  const { t, locale } = useTranslation();
  const heading =
    entry.type === 'investment' ? t(`app.journalList.subjects.${entry.subjectKey}`) : entry.title;

  return (
    <Card className="space-y-4 p-5">
      <h2 className="min-w-0 text-xl font-extrabold tracking-tight [overflow-wrap:anywhere]">
        {heading}
      </h2>
      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 text-sm">
        <dt className="text-muted-foreground">{t('app.journalDetail.metadata.recordType')}</dt>
        <dd className="justify-self-end">
          <RecordTagBadge kind="entryType" value={entry.type} />
        </dd>
        <dt className="text-muted-foreground">{t('app.journalDetail.metadata.recordedAt')}</dt>
        <dd className="text-right font-medium">
          <time dateTime={entry.recordedAt}>{formatLocalizedDate(entry.recordedAt, locale)}</time>
        </dd>
        {entry.type === 'investment' && (
          <>
            <dt className="text-muted-foreground">{t('app.journalDetail.metadata.pastAction')}</dt>
            <dd className="justify-self-end">
              <RecordTagBadge kind="action" value={entry.action} />
            </dd>
            {entry.emotion && (
              <>
                <dt className="text-muted-foreground">
                  {t('app.journalDetail.metadata.pastEmotion')}
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

export function JournalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { t } = useTranslation();
  const entry = JOURNAL_ENTRIES.find((item) => item.id === id);
  const locationState = location.state as JournalDetailLocationState | null;
  const decisionContext = locationState?.decisionContext ?? entry?.decisionContext;

  if (!entry) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-6 px-5 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <DetailHeader
          title={t('app.journalDetail.notFound.heading')}
          backLabel={t('app.journalDetail.backLabel')}
        />
        <Card className="p-2">
          <EmptyState
            title={t('app.journalDetail.notFound.description')}
            action={
              <Link
                className={cn(buttonVariants({ variant: 'default' }), 'mt-2 min-h-11')}
                to={APP_ROUTE_PATHS.journalList}
              >
                {t('app.journalDetail.notFound.listAction')}
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 px-5 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <DetailHeader
        title={t('app.journalDetail.headerTitle')}
        backLabel={t('app.journalDetail.backLabel')}
      />

      <EntrySummary entry={entry} />

      {entry.type === 'investment' ? (
        <>
          <section className="space-y-2" aria-labelledby="journal-detail-investment-question">
            <h2
              id="journal-detail-investment-question"
              className="text-text-tertiary text-xs font-bold tracking-wider"
            >
              {t('app.journalDetail.investment.questionHeading')}
            </h2>
            <Card className="border-l-primary border-l-4 p-4">
              <p className="min-w-0 text-lg leading-7 font-semibold [overflow-wrap:anywhere]">
                {entry.question}
              </p>
            </Card>
          </section>

          <section className="space-y-3" aria-labelledby="journal-detail-ai-checklist">
            <div className="flex items-center justify-between gap-3">
              <h2 id="journal-detail-ai-checklist" className="text-base font-bold">
                {t('app.journalDetail.investment.aiChecklistHeading')}
              </h2>
              <span className="text-primary shrink-0 text-xs font-semibold">
                {t('app.journalDetail.itemCount', {
                  count: String(entry.aiChecklist.length),
                })}
              </span>
            </div>
            <NumberedChecklist items={entry.aiChecklist} />
          </section>

          <section className="space-y-2" aria-labelledby="journal-detail-record">
            <h2 id="journal-detail-record" className="text-base font-bold">
              {t('app.journalDetail.investment.recordHeading')}
            </h2>
            <Card className="p-4">
              <p className="min-w-0 text-sm leading-7 [overflow-wrap:anywhere]">{entry.memo}</p>
            </Card>
          </section>

          <section className="space-y-3" aria-labelledby="journal-detail-checked-items">
            <div className="flex items-center justify-between gap-3">
              <h2 id="journal-detail-checked-items" className="text-base font-bold">
                {t('app.journalDetail.investment.checkedItemsHeading')}
              </h2>
              <span className="text-primary shrink-0 text-xs font-semibold">
                {t('app.journalDetail.checkedProgress', {
                  checked: String(entry.checkedCount),
                  total: String(entry.totalCount),
                })}
              </span>
            </div>
            <StatusChecklist
              items={entry.decisionChecks}
              checkedLabel={t('app.journalDetail.checkedStatus')}
              uncheckedLabel={t('app.journalDetail.uncheckedStatus')}
            />
          </section>
        </>
      ) : (
        <>
          <section className="space-y-2" aria-labelledby="journal-detail-study-question">
            <h2
              id="journal-detail-study-question"
              className="text-text-tertiary text-xs font-bold tracking-wider"
            >
              {t('app.journalDetail.study.questionHeading')}
            </h2>
            <Card className="border-l-muted-foreground border-l-4 p-4">
              <p className="min-w-0 text-lg leading-7 font-semibold [overflow-wrap:anywhere]">
                {entry.question}
              </p>
            </Card>
          </section>

          <section className="space-y-2" aria-labelledby="journal-detail-study-summary">
            <h2 id="journal-detail-study-summary" className="text-base font-bold">
              {t('app.journalDetail.study.summaryHeading')}
            </h2>
            <Card className="p-4">
              <p className="min-w-0 text-sm leading-7 [overflow-wrap:anywhere]">{entry.memo}</p>
            </Card>
          </section>

          <section className="space-y-3" aria-labelledby="journal-detail-next-checks">
            <div className="flex items-center justify-between gap-3">
              <h2 id="journal-detail-next-checks" className="text-base font-bold">
                {t('app.journalDetail.study.nextChecksHeading')}
              </h2>
              <span className="text-primary shrink-0 text-xs font-semibold">
                {t('app.journalDetail.checkedProgress', {
                  checked: String(entry.checkedCount),
                  total: String(entry.totalCount),
                })}
              </span>
            </div>
            <StatusChecklist
              items={entry.nextChecks}
              checkedLabel={t('app.journalDetail.checkedStatus')}
              uncheckedLabel={t('app.journalDetail.uncheckedStatus')}
            />
          </section>
        </>
      )}

      {decisionContext && <DecisionContextSnapshotView context={decisionContext} />}

      <nav aria-label={t('app.journalDetail.headerTitle')}>
        <Link
          className={cn(
            buttonVariants({ size: 'lg' }),
            'h-auto min-h-[54px] w-full text-center whitespace-normal',
          )}
          to={buildAppJournalReviewPath(entry.id)}
        >
          {t('app.journalDetail.navigation.review')}
        </Link>
      </nav>
    </div>
  );
}
