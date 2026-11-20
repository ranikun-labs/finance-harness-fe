import { useCallback, useRef, useState } from 'react';
import { useOutletContext } from 'react-router';
import type { JournalTypeFilterValue } from '@/components/journal/JournalTypeFilter';

import { DeletedJournalList } from '@/features/journal-delete/JournalLifecycleControls';
import { JournalList } from '@/components/journal/JournalList';
import { useJournalReadPort } from '@/features/journal-read/JournalReadPortContext';
import type { JournalReadPort } from '@/features/journal-read/model/journalReadPort';
import { useJournalList } from '@/features/journal-read/model/useJournalList';

export interface JournalListPageProps {
  selectedId?: string;
  readPort?: JournalReadPort;
}

export function JournalListPage({ selectedId, readPort }: JournalListPageProps) {
  const [filter, setFilter] = useState<JournalTypeFilterValue>('all');
  const serverFilter = import.meta.env.VITE_FINANCE_JOURNAL_SERVER_FILTER_ENABLED === 'true';
  const pendingFilterFocus = useRef(false);
  const restoreFilterFocus = useCallback((button: HTMLButtonElement) => {
    if (!pendingFilterFocus.current) return;
    pendingFilterFocus.current = false;
    button.focus();
  }, []);
  const changeFilter = (next: JournalTypeFilterValue) => {
    if (next === filter) return;
    pendingFilterFocus.current =
      serverFilter &&
      document.activeElement instanceof HTMLElement &&
      document.activeElement.dataset.journalFilter !== undefined;
    setFilter(next);
  };
  return (
    <JournalListPageContent
      key={serverFilter ? filter : 'local'}
      selectedId={selectedId}
      readPort={readPort}
      filter={filter}
      setFilter={changeFilter}
      restoreFilterFocus={restoreFilterFocus}
      serverFilter={serverFilter}
    />
  );
}

function JournalListPageContent({
  selectedId,
  readPort,
  filter,
  setFilter,
  serverFilter,
  restoreFilterFocus,
}: JournalListPageProps & {
  filter: JournalTypeFilterValue;
  setFilter: (filter: JournalTypeFilterValue) => void;
  serverFilter: boolean;
  restoreFilterFocus: (button: HTMLButtonElement) => void;
}) {
  const workspace = useOutletContext<{
    setHasSelectableRecords: (value: boolean) => void;
  } | null>();
  const setHasSelectableRecords = workspace?.setHasSelectableRecords;
  const contextPort = useJournalReadPort();
  const { state, retry, loadMore } = useJournalList({
    port: readPort ?? contextPort,
    type: serverFilter && filter !== 'all' ? filter : undefined,
  });

  return (
    <>
      <DeletedJournalList />
      <JournalList
        entries={state.items}
        filter={filter}
        onFilterChange={setFilter}
        serverFilter={serverFilter}
        restoreFilterFocus={restoreFilterFocus}
        selectedId={selectedId}
        status={state.status}
        nextCursor={state.nextCursor}
        error={state.error}
        errorPhase={state.errorPhase}
        onRetry={retry}
        onLoadMore={loadMore}
        onSelectableRecordsChange={setHasSelectableRecords}
      />
    </>
  );
}
