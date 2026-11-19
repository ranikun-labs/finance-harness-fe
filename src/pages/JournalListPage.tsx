import { useEffect } from 'react';
import { useOutletContext } from 'react-router';

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
  const workspace = useOutletContext<{
    setHasSelectableRecords: (value: boolean) => void;
  } | null>();
  const setHasSelectableRecords = workspace?.setHasSelectableRecords;
  const contextPort = useJournalReadPort();
  const { state, retry, loadMore } = useJournalList({ port: readPort ?? contextPort });

  const hasSelectableRecords =
    state.items.length > 0 && !(state.status === 'error' && state.errorPhase === 'initial');
  useEffect(() => {
    setHasSelectableRecords?.(hasSelectableRecords);
  }, [setHasSelectableRecords, hasSelectableRecords]);

  return (
    <>
      <DeletedJournalList />
      <JournalList
        entries={state.items}
        selectedId={selectedId}
        status={state.status}
        nextCursor={state.nextCursor}
        error={state.error}
        errorPhase={state.errorPhase}
        onRetry={retry}
        onLoadMore={loadMore}
      />
    </>
  );
}
