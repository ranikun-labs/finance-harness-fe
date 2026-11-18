import { createContext, useContext } from 'react';
import type { JournalEditFetch } from './journalEditPort';
export const JournalEditFetchContext = createContext<JournalEditFetch | undefined>(undefined);
export const useJournalEditFetch = () => useContext(JournalEditFetchContext);
