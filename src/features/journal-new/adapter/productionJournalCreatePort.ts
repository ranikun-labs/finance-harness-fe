import {
  HttpJournalCreatePort,
  type JournalFetch,
} from '@/features/journal-new/adapter/HttpJournalCreatePort';
import type { JournalCreatePort } from '@/features/journal-new/model/journalCreatePort';

export type ProductionJournalCreatePortOptions = {
  fetchImpl?: JournalFetch;
  timeZone?: string;
};

export function createProductionJournalCreatePort(
  options: ProductionJournalCreatePortOptions = {},
): JournalCreatePort {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const timeZone = options.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  return new HttpJournalCreatePort({ fetchImpl, timeZone });
}
