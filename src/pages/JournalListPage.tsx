import { JournalList } from '@/components/journal/JournalList';
import { useJournalReadPort } from '@/features/journal-read/JournalReadPortContext';
import type { JournalReadPort } from '@/features/journal-read/model/journalReadPort';
import { useJournalList } from '@/features/journal-read/model/useJournalList';

export interface JournalListPageProps {
  selectedId?: string;
  readPort?: JournalReadPort;
}

export function JournalListPage({ selectedId, readPort }: JournalListPageProps) {
  const contextPort = useJournalReadPort();
  const { state, retry, loadMore } = useJournalList({ port: readPort ?? contextPort });

  return (
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
  );
}
