import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import { EmptyState } from '@/components/common/EmptyState';
import { JournalSummaryRow } from '@/components/journal/JournalSummaryRow';
import {
  JournalTypeFilter,
  type JournalTypeFilterValue,
} from '@/components/journal/JournalTypeFilter';
import { Stack } from '@/components/layout/Stack';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { APP_ROUTE_PATHS, AUTH_ROUTE_PATHS } from '@/constants/routes';
import type { AuthEntryLocationState } from '@/features/auth/authPresentation';
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
  filter?: JournalTypeFilterValue;
  onFilterChange?: (filter: JournalTypeFilterValue) => void;
  serverFilter?: boolean;
  restoreFilterFocus?: (button: HTMLButtonElement) => void;
  selectedId?: string;
  status?: JournalListStatus;
  nextCursor?: string | null;
  error?: JournalReadError | null;
  errorPhase?: JournalListErrorPhase | null;
  onRetry?: () => void;
  onLoadMore?: () => void;
  onSelectableRecordsChange?: (available: boolean) => void;
}

/** 비오류 상태(로그인 필요 등). 테두리 없이 카드 면 + 제목 → 설명 → 행동 한 가지. */
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
    <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center" role="status">
      <p className="type-content-title text-foreground">{title}</p>
      <p className="type-supporting text-text-secondary break-keep">{description}</p>
      {action}
    </Card>
  );
}

/**
 * 첫 로딩. 질문(제목)과 자리는 유지하고 행 모양 자리표시자 3줄을 둔다. 움직임은 선호 설정을 따른다.
 * 자리표시자는 장식이라 스크린리더에서 숨기고 상태 문장만 `role="status"`로 알린다.
 */
function LoadingRows({ title, description }: { title: string; description: string }) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div role="status" className="flex flex-col gap-1">
        <p className="type-content-title text-foreground">{title}</p>
        <p className="type-supporting text-text-secondary break-keep">{description}</p>
      </div>
      <div aria-hidden="true" className="flex flex-col gap-2">
        {[0, 1, 2].map((row) => (
          <div key={row} className="bg-control rounded-inset h-14 motion-safe:animate-pulse" />
        ))}
      </div>
    </Card>
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
  if (phase !== 'load-more' && error.status === 401) {
    const state: AuthEntryLocationState = {
      resumeJournalList: true,
      fallbackCancelTarget: APP_ROUTE_PATHS.journalList,
      fallbackCancelLabel: 'app.journalNew.backToJournal',
    };
    return (
      <StatusMessage
        title={t('app.journalList.signInRequired.title')}
        description={t('app.journalList.signInRequired.description')}
        action={
          <Link
            to={AUTH_ROUTE_PATHS.entry}
            state={state}
            className={cn(buttonVariants({ size: 'sm' }), 'min-h-11')}
          >
            {t('app.journalList.signInRequired.action')}
          </Link>
        }
      />
    );
  }

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
    <Card>
      <ErrorState
        className={phase === 'load-more' ? 'py-6' : undefined}
        title={copy}
        description={description}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className={cn(
                  buttonVariants({
                    variant: phase === 'load-more' ? 'outline' : 'default',
                    size: 'sm',
                  }),
                  'min-h-11',
                )}
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
    </Card>
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
  onSelectableRecordsChange,
  filter: controlledFilter,
  onFilterChange,
  serverFilter = false,
  restoreFilterFocus,
}: JournalListProps) {
  const { t } = useTranslation();
  const [localFilter, setLocalFilter] = useState<JournalTypeFilterValue>('all');
  const filter = controlledFilter ?? localFilter;
  const setFilter = onFilterChange ?? setLocalFilter;
  const Heading = selectedId ? 'h2' : 'h1';
  const isInitialLoading = status === 'loading';
  const hasInitialError = status === 'error' && errorPhase !== 'load-more';
  const hasPendingEmptyPage = entries.length === 0 && nextCursor !== null;
  const visibleEntries =
    filter === 'all' ? entries : entries.filter((entry) => entry.type === filter);
  const hasSelectableRecords = !hasInitialError && visibleEntries.length > 0;
  const hasNoFilteredMatch = filter !== 'all' && visibleEntries.length === 0;

  useEffect(() => {
    onSelectableRecordsChange?.(hasSelectableRecords);
  }, [hasSelectableRecords, onSelectableRecordsChange]);

  return (
    <Stack gap="group" className="min-h-full px-5 pt-6 pb-10 sm:px-6">
      {/* 2-pane(selectedId)에서는 상세가 page-title을 갖고 목록 제목은 한 단계 낮춘다. */}
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
        <Heading
          className={cn(
            'text-foreground min-w-0 wrap-anywhere',
            selectedId ? 'type-section-title' : 'type-page-title',
          )}
        >
          {t('app.journalList.title')}
        </Heading>
        {status !== 'empty' || nextCursor !== null ? (
          <Link
            to={APP_ROUTE_PATHS.journalNew}
            className={cn(
              buttonVariants({
                variant: hasInitialError ? 'neutral' : 'subtle',
                size: 'sm',
              }),
              'shrink-0',
            )}
          >
            {t('app.journalList.newRecord')}
          </Link>
        ) : null}
      </div>

      {serverFilter && (
        <JournalTypeFilter value={filter} onChange={setFilter} restoreFocus={restoreFilterFocus} />
      )}

      {isInitialLoading ? (
        <LoadingRows
          title={t('app.journalList.loading.title')}
          description={t('app.journalList.loading.description')}
        />
      ) : hasInitialError && error ? (
        <ErrorMessage error={error} phase={errorPhase} onRetry={onRetry} />
      ) : status === 'empty' && !hasPendingEmptyPage && filter === 'all' ? (
        <Card>
          <EmptyState
            title={t('app.journalList.emptyAll.title')}
            description={t('app.journalList.emptyAll.description')}
            action={
              <div className="flex flex-col items-center gap-3">
                <Link
                  to={APP_ROUTE_PATHS.journalNew}
                  className={cn(buttonVariants({ size: 'lg' }))}
                >
                  {t('app.journalList.emptyAll.cta')}
                </Link>
                <p className="text-text-secondary max-w-[260px] text-center text-xs leading-relaxed">
                  {t('app.journalList.emptyAll.hint')}
                </p>
                <Link
                  to={APP_ROUTE_PATHS.appHome}
                  className={cn(buttonVariants({ variant: 'text', size: 'sm' }), 'min-h-11')}
                >
                  {t('app.journalList.backToReview')}
                </Link>
              </div>
            }
          />
        </Card>
      ) : (
        <>
          {!serverFilter && <JournalTypeFilter value={filter} onChange={setFilter} />}
          {!serverFilter &&
            filter !== 'all' &&
            nextCursor !== null &&
            visibleEntries.length > 0 && (
              <p className="type-supporting text-text-secondary">
                {t('app.journalList.filteredPageScope')}
              </p>
            )}
          {hasNoFilteredMatch &&
            status !== 'loading-more' &&
            status !== 'error' &&
            (nextCursor !== null ? (
              <p className="type-supporting text-text-secondary" role="status">
                {t('app.journalList.filteredPagePending')}
              </p>
            ) : (
              <Card>
                <EmptyState
                  title={t('app.journalList.emptyFilter.title')}
                  description={t('app.journalList.emptyFilter.description')}
                  action={
                    <button
                      type="button"
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'min-h-11')}
                      onClick={() => setFilter('all')}
                    >
                      {t('app.journalList.emptyFilter.resetAction')}
                    </button>
                  }
                />
              </Card>
            ))}
          {filter === 'all' && hasPendingEmptyPage && status === 'empty' && (
            <p className="type-supporting text-text-secondary" role="status">
              {t('app.journalList.emptyPage')}
            </p>
          )}
          {visibleEntries.length > 0 && (
            <Card className="p-2">
              <ul>
                {visibleEntries.map((entry) => (
                  <JournalSummaryRow
                    key={entry.journalId}
                    entry={entry}
                    selected={entry.journalId === selectedId}
                  />
                ))}
              </ul>
            </Card>
          )}

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
          ) : hasNoFilteredMatch ? null : (
            <p className="type-meta text-text-secondary px-1">{t('app.journalList.endOfList')}</p>
          )}
        </>
      )}
    </Stack>
  );
}
