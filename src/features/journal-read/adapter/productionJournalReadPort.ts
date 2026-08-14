import {
  HttpJournalReadPort,
  type JournalReadFetch,
} from '@/features/journal-read/adapter/HttpJournalReadPort';
import type { JournalReadPort } from '@/features/journal-read/model/journalReadPort';

export interface ProductionJournalReadPortOptions {
  fetchImpl?: JournalReadFetch;
}

export function createProductionJournalReadPort(
  options: ProductionJournalReadPortOptions = {},
): JournalReadPort {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  return new HttpJournalReadPort({ fetchImpl });
}

/** One application-owned same-origin read port; tests can inject a deterministic port. */
export const productionJournalReadPort = createProductionJournalReadPort();
