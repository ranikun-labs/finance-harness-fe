import { useState } from 'react';
import { Link } from 'react-router';

import { EmptyState } from '@/components/common/EmptyState';
import { JournalRecordCard } from '@/components/journal/JournalRecordCard';
import {
  JournalTypeFilter,
  type JournalTypeFilterValue,
} from '@/components/journal/JournalTypeFilter';
import { buttonVariants } from '@/components/ui/button';
import { buildAppAskPath } from '@/constants/routes';
import { useTranslation } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { JournalEntry } from '@/mocks/journalEntries';

interface JournalListProps {
  entries: JournalEntry[];
  selectedId?: string;
}

/**
 * 전체 없음 / populated / 필터 결과 없음 세 상태를 분기하는 presentational composition.
 * 선택 필터는 이 컴포넌트가 소유하는 유일한 local UI state다.
 */
export function JournalList({ entries, selectedId }: JournalListProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<JournalTypeFilterValue>('all');
  const Heading = selectedId ? 'h2' : 'h1';

  const hasAnyEntries = entries.length > 0;
  const filteredEntries =
    filter === 'all' ? entries : entries.filter((entry) => entry.type === filter);

  return (
    <div className="flex min-h-full flex-col gap-4 p-4">
      <Heading className="text-foreground text-2xl font-extrabold tracking-tight">
        {t('app.journalList.title')}
      </Heading>

      {!hasAnyEntries ? (
        <EmptyState
          title={t('app.journalList.emptyAll.title')}
          description={t('app.journalList.emptyAll.description')}
          action={
            <div className="flex flex-col items-center gap-3">
              <Link to={buildAppAskPath()} className={cn(buttonVariants({ size: 'lg' }))}>
                {t('app.journalList.emptyAll.cta')}
              </Link>
              <p className="text-muted-foreground max-w-[260px] text-center text-xs leading-relaxed">
                {t('app.journalList.emptyAll.hint')}
              </p>
            </div>
          }
        />
      ) : (
        <>
          <JournalTypeFilter value={filter} onChange={setFilter} />

          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
              <div className="flex flex-col gap-1.5">
                <p className="text-foreground text-base font-semibold">
                  {t('app.journalList.emptyFilter.title')}
                </p>
                <p className="text-muted-foreground text-sm">
                  {t('app.journalList.emptyFilter.description')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'min-h-11')}
              >
                {t('app.journalList.emptyFilter.resetAction')}
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {filteredEntries.map((entry) => (
                  <JournalRecordCard
                    key={entry.id}
                    entry={entry}
                    selected={entry.id === selectedId}
                  />
                ))}
              </div>
              <p className="text-muted-foreground pt-2 pb-1 text-center text-xs">
                {t('app.journalList.countLabel', { count: String(filteredEntries.length) })}
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
