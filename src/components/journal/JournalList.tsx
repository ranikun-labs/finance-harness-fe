import { Link } from 'react-router';

import { EmptyState } from '@/components/common/EmptyState';
import { JournalSummaryCard } from '@/components/journal/JournalSummaryCard';
import { buttonVariants } from '@/components/ui/button';
import { APP_ROUTE_PATHS } from '@/constants/routes';
import { useTranslation } from '@/i18n/I18nContext';
import type {
  JournalListErrorPhase,
  JournalListStatus,
} from '@/features/journal-read/model/journalListState';
import type { JournalReadError } from '@/features/journal-read/model/journalReadPort';
import type { JournalListItemViewModel } from '@/features/journal-read/model/journalReadViewModel';
import { cn } from '@/lib/utils';

interface JournalListProps {
  entries: JournalListItemViewModel[];
  selectedId?: string;
  status?: JournalListStatus;
  nextCursor?: string | null;
  error?: JournalReadError | null;
  errorPhase?: JournalListErrorPhase | null;
  onRetry?: () => void;
  onLoadMore?: () => void;
}

function StatusMessage({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="border-border bg-card flex flex-col items-center gap-3 rounded-2xl border px-6 py-12 text-center"
      role="status"
    >
      <p className="text-foreground text-base font-semibold">{title}</p>
      <p className="text-muted-foreground text-sm">{description}</p>
      {action}
    </div>
  );
}

function ErrorMessage({
  error,
  phase,
  onRetry,
}: {
  error: JournalReadError;
  phase: JournalListErrorPhase | null | undefined;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();
  const copy =
    phase === 'load-more'
      ? t('app.journalList.loadMoreError.title')
      : error.code === 'invalid_request'
        ? t('app.journalList.invalidRequest.title')
        : error.code === 'invalid_result'
          ? t('app.journalList.invalidResult.title')
          : t('app.journalList.error.title');
  const description =
    phase === 'load-more'
      ? t('app.journalList.loadMoreError.description')
      : error.code === 'invalid_request'
        ? t('app.journalList.invalidRequest.description')
        : error.code === 'invalid_result'
          ? t('app.journalList.invalidResult.description')
          : t('app.journalList.error.description');
  const retryLabel =
    phase === 'load-more'
      ? t('app.journalList.loadMoreError.retry')
      : error.code === 'invalid_request'
        ? t('app.journalList.invalidRequest.retry')
        : error.code === 'invalid_result'
          ? t('app.journalList.invalidResult.retry')
          : t('app.journalList.error.retry');

  return (
    <StatusMessage
      title={copy}
      description={description}
      action={
        <div className="flex flex-wrap justify-center gap-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'min-h-11')}
            >
              {retryLabel}
            </button>
          )}
          {phase !== 'load-more' && (
            <Link
              to={APP_ROUTE_PATHS.appHome}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'min-h-11')}
            >
              {t('app.journalList.backToReview')}
            </Link>
          )}
        </div>
      }
    />
  );
}

/**
 * Renders only the canonical paginated summary projection. The loaded length is never shown
 * as a total because the server deliberately does not provide totalCount.
 */
export function JournalList({
  entries,
  selectedId,
  status = 'loaded',
  nextCursor = null,
  error = null,
  errorPhase = null,
  onRetry,
  onLoadMore,
}: JournalListProps) {
  const { t } = useTranslation();
  const Heading = selectedId ? 'h2' : 'h1';
  const isInitialLoading = status === 'loading';
  const hasInitialError = status === 'error' && errorPhase !== 'load-more';
  const hasPendingEmptyPage = entries.length === 0 && nextCursor !== null;

  return (
    <div className="flex min-h-full flex-col gap-6 px-5 py-8 sm:px-8 sm:py-10">
      <div className="border-border flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <Heading className="text-foreground text-3xl leading-tight font-bold tracking-tight">
          {t('app.journalList.title')}
        </Heading>
        {status !== 'empty' || nextCursor !== null ? (
          <Link
            to={APP_ROUTE_PATHS.journalNew}
            className={cn(
              buttonVariants({ variant: hasInitialError ? 'outline' : 'default' }),
              'min-h-11',
            )}
          >
            {t('app.journalList.newRecord')}
          </Link>
        ) : null}
      </div>

      {isInitialLoading ? (
        <StatusMessage
          title={t('app.journalList.loading.title')}
          description={t('app.journalList.loading.description')}
        />
      ) : hasInitialError && error ? (
        <ErrorMessage error={error} phase={errorPhase} onRetry={onRetry} />
      ) : status === 'empty' && !hasPendingEmptyPage ? (
        <EmptyState
          title={t('app.journalList.emptyAll.title')}
          description={t('app.journalList.emptyAll.description')}
          action={
            <div className="flex flex-col items-center gap-3">
              <Link to={APP_ROUTE_PATHS.journalNew} className={cn(buttonVariants({ size: 'lg' }))}>
                {t('app.journalList.emptyAll.cta')}
              </Link>
              <p className="text-muted-foreground max-w-[260px] text-center text-xs leading-relaxed">
                {t('app.journalList.emptyAll.hint')}
              </p>
              {nextCursor !== null && onLoadMore && (
                <button
                  type="button"
                  onClick={onLoadMore}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'min-h-11')}
                >
                  {t('app.journalList.loadMore')}
                </button>
              )}
            </div>
          }
        />
      ) : (
        <>
          {hasPendingEmptyPage && status === 'empty' && (
            <p className="text-muted-foreground text-sm" role="status">
              {t('app.journalList.emptyPage')}
            </p>
          )}
          <div className="flex flex-col gap-4">
            {entries.map((entry) => (
              <JournalSummaryCard
                key={entry.journalId}
                entry={entry}
                selected={entry.journalId === selectedId}
              />
            ))}
          </div>

          {status === 'error' && error && errorPhase === 'load-more' && (
            <ErrorMessage error={error} phase={errorPhase} onRetry={onRetry} />
          )}

          {status === 'loading-more' ? (
            <StatusMessage
              title={t('app.journalList.loadingMore')}
              description={t('app.journalList.loading.description')}
            />
          ) : status === 'error' && errorPhase === 'load-more' ? null : nextCursor !== null &&
            onLoadMore ? (
            <button
              type="button"
              onClick={onLoadMore}
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'min-h-11')}
            >
              {t('app.journalList.loadMore')}
            </button>
          ) : (
            <p className="text-muted-foreground pt-2 pb-1 text-center text-xs">
              {t('app.journalList.endOfList')}
            </p>
          )}
        </>
      )}
    </div>
  );
}
