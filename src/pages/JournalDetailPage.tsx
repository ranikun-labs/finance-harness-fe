import { Link, useParams } from 'react-router';
import type { ReactNode } from 'react';

import { RecordTagBadge } from '@/components/common/RecordTagBadge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { APP_ROUTE_PATHS, buildAppJournalReviewPath } from '@/constants/routes';
import { useJournalReadPort } from '@/features/journal-read/JournalReadPortContext';
import type {
  JournalReadError,
  JournalReadPort,
} from '@/features/journal-read/model/journalReadPort';
import { useJournalDetail } from '@/features/journal-read/model/useJournalDetail';
import type { JournalDetailViewModel } from '@/features/journal-read/model/journalReadViewModel';
import { useTranslation } from '@/i18n/I18nContext';
import { formatJournalOccurredAt } from '@/lib/date';
import { cn } from '@/lib/utils';

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

function DetailStatus({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center" role="status">
      <p className="text-foreground text-base font-semibold">{title}</p>
      <p className="text-muted-foreground text-sm">{description}</p>
      {action}
    </div>
  );
}

function DetailError({ error, onRetry }: { error: JournalReadError; onRetry: () => void }) {
  const { t } = useTranslation();
  if (error.code === 'journal_not_found') {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center" role="status">
        <p className="text-muted-foreground text-sm">
          {t('app.journalDetail.notFound.description')}
        </p>
        <Link
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'min-h-11')}
          to={APP_ROUTE_PATHS.journalList}
        >
          {t('app.journalDetail.notFound.listAction')}
        </Link>
      </div>
    );
  }

  const copy =
    error.code === 'invalid_request'
      ? {
          title: t('app.journalDetail.invalidRequest.title'),
          description: t('app.journalDetail.invalidRequest.description'),
          retry: t('app.journalDetail.invalidRequest.retry'),
        }
      : error.code === 'invalid_result'
        ? {
            title: t('app.journalDetail.invalidResult.title'),
            description: t('app.journalDetail.invalidResult.description'),
            retry: t('app.journalDetail.invalidResult.retry'),
          }
        : {
            title: t('app.journalDetail.error.title'),
            description: t('app.journalDetail.error.description'),
            retry: t('app.journalDetail.error.retry'),
          };

  return (
    <DetailStatus
      title={copy.title}
      description={copy.description}
      action={
        <button
          type="button"
          onClick={onRetry}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'min-h-11')}
        >
          {copy.retry}
        </button>
      }
    />
  );
}

function JournalMetadata({ detail }: { detail: JournalDetailViewModel }) {
  const { t, locale } = useTranslation();
  return (
    <Card className="p-5">
      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 text-sm">
        <dt className="text-muted-foreground">{t('app.journalDetail.metadata.recordType')}</dt>
        <dd className="justify-self-end">
          <RecordTagBadge kind="entryType" value={detail.type} />
        </dd>
        <dt className="text-muted-foreground">{t('app.journalDetail.metadata.recordedAt')}</dt>
        <dd className="text-right font-medium">
          <time dateTime={detail.occurredAt}>
            {formatJournalOccurredAt(detail.occurredAt, detail.timeZone, locale)}
          </time>
        </dd>
        <dt className="text-muted-foreground">{t('app.journalDetail.metadata.timeZone')}</dt>
        <dd className="text-right font-medium [overflow-wrap:anywhere]">{detail.timeZone}</dd>
        {detail.type === 'investment' && (
          <>
            <dt className="text-muted-foreground">{t('app.journalDetail.metadata.pastAction')}</dt>
            <dd className="justify-self-end">
              <RecordTagBadge kind="action" value={detail.action} />
            </dd>
            {detail.emotion !== null && (
              <>
                <dt className="text-muted-foreground">
                  {t('app.journalDetail.metadata.pastEmotion')}
                </dt>
                <dd className="justify-self-end">
                  <RecordTagBadge kind="emotion" value={detail.emotion} />
                </dd>
              </>
            )}
          </>
        )}
        <dt className="text-muted-foreground">{t('app.journalDetail.metadata.createdAt')}</dt>
        <dd className="text-right font-medium">
          <time dateTime={detail.createdAt}>{detail.createdAt}</time>
        </dd>
        <dt className="text-muted-foreground">{t('app.journalDetail.metadata.updatedAt')}</dt>
        <dd className="text-right font-medium">
          <time dateTime={detail.updatedAt}>{detail.updatedAt}</time>
        </dd>
      </dl>
    </Card>
  );
}

function InvestmentDetail({
  detail,
}: {
  detail: Extract<JournalDetailViewModel, { type: 'investment' }>;
}) {
  const { t } = useTranslation();
  return (
    <section className="space-y-2" aria-labelledby="journal-detail-investment-reasoning">
      <h2 id="journal-detail-investment-reasoning" className="text-base font-bold">
        {t('app.journalDetail.investment.reasoningHeading')}
      </h2>
      <Card className="p-4">
        <p className="min-w-0 text-sm leading-7 [overflow-wrap:anywhere]">{detail.reasoning}</p>
      </Card>
    </section>
  );
}

function StudyDetail({ detail }: { detail: Extract<JournalDetailViewModel, { type: 'study' }> }) {
  const { t } = useTranslation();
  return (
    <>
      <section className="space-y-2" aria-labelledby="journal-detail-study-content">
        <h2 id="journal-detail-study-content" className="text-base font-bold">
          {t('app.journalDetail.study.keyContentHeading')}
        </h2>
        <Card className="p-4">
          <p className="min-w-0 text-sm leading-7 [overflow-wrap:anywhere]">{detail.keyContent}</p>
        </Card>
      </section>

      <section className="space-y-2" aria-labelledby="journal-detail-study-open-questions">
        <h2 id="journal-detail-study-open-questions" className="text-base font-bold">
          {t('app.journalDetail.study.openQuestionsHeading')}
        </h2>
        {detail.openQuestions.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t('app.journalDetail.study.noOpenQuestions')}
          </p>
        ) : (
          <Card>
            <ol className="divide-border list-decimal divide-y pl-10">
              {detail.openQuestions.map((question, index) => (
                <li
                  className="min-w-0 p-4 pl-2 text-sm leading-6 [overflow-wrap:anywhere]"
                  key={`${index}-${question}`}
                >
                  {question}
                </li>
              ))}
            </ol>
          </Card>
        )}
      </section>
    </>
  );
}

function JournalDetailContent({ detail }: { detail: JournalDetailViewModel }) {
  const { t } = useTranslation();
  const title = detail.type === 'investment' ? detail.assetName : detail.title;

  return (
    <>
      <section className="space-y-3" aria-labelledby="journal-detail-title">
        <h2
          id="journal-detail-title"
          className="min-w-0 text-xl font-extrabold tracking-tight [overflow-wrap:anywhere]"
        >
          {title}
        </h2>
        <JournalMetadata detail={detail} />
      </section>

      {detail.type === 'investment' ? (
        <InvestmentDetail detail={detail} />
      ) : (
        <StudyDetail detail={detail} />
      )}

      <nav aria-label={t('app.journalDetail.headerTitle')}>
        <Link
          className={cn(
            buttonVariants({ size: 'lg' }),
            'h-auto min-h-[54px] w-full text-center whitespace-normal',
          )}
          to={buildAppJournalReviewPath(detail.journalId)}
        >
          {t('app.journalDetail.navigation.review')}
        </Link>
      </nav>
    </>
  );
}

export interface JournalDetailPageProps {
  readPort?: JournalReadPort;
}

export function JournalDetailPage({ readPort }: JournalDetailPageProps) {
  const { id } = useParams();
  const contextPort = useJournalReadPort();
  const { state, retry } = useJournalDetail(readPort ?? contextPort, id);
  const { t } = useTranslation();
  const headerTitle =
    state.error?.code === 'journal_not_found'
      ? t('app.journalDetail.notFound.heading')
      : t('app.journalDetail.headerTitle');

  return (
    <div className="flex min-h-full flex-col gap-5 p-4">
      <DetailHeader title={headerTitle} backLabel={t('app.journalDetail.backLabel')} />
      {state.status === 'loading' && (
        <DetailStatus
          title={t('app.journalDetail.loading.title')}
          description={t('app.journalDetail.loading.description')}
        />
      )}
      {state.status === 'error' && state.error && (
        <DetailError error={state.error} onRetry={retry} />
      )}
      {state.status === 'success' && state.data && <JournalDetailContent detail={state.data} />}
    </div>
  );
}
