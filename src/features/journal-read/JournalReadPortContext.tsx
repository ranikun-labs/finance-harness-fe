import { createContext, useContext, type ReactNode } from 'react';

import { productionJournalReadPort } from '@/features/journal-read/adapter/productionJournalReadPort';
import type { JournalReadPort } from '@/features/journal-read/model/journalReadPort';

const JournalReadPortContext = createContext<JournalReadPort>(productionJournalReadPort);

interface JournalReadPortProviderProps {
  port?: JournalReadPort;
  children: ReactNode;
}

export function JournalReadPortProvider({ port, children }: JournalReadPortProviderProps) {
  return (
    <JournalReadPortContext.Provider value={port ?? productionJournalReadPort}>
      {children}
    </JournalReadPortContext.Provider>
  );
}

export function useJournalReadPort(): JournalReadPort {
  return useContext(JournalReadPortContext);
}
