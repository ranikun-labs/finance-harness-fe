import { JournalList } from '@/components/journal/JournalList';
import { JOURNAL_ENTRIES } from '@/mocks/journalEntries';

export function JournalListPage() {
  return <JournalList entries={JOURNAL_ENTRIES} />;
}
