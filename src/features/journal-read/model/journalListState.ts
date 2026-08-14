import type { JournalReadError } from '@/features/journal-read/model/journalReadPort';
import type { JournalListItemViewModel } from '@/features/journal-read/model/journalReadViewModel';

export type JournalListStatus = 'loading' | 'loaded' | 'empty' | 'loading-more' | 'error';
export type JournalListErrorPhase = 'initial' | 'load-more';

export interface JournalListState {
  status: JournalListStatus;
  items: JournalListItemViewModel[];
  nextCursor: string | null;
  error: JournalReadError | null;
  errorPhase: JournalListErrorPhase | null;
}

export const initialJournalListState: JournalListState = {
  status: 'loading',
  items: [],
  nextCursor: null,
  error: null,
  errorPhase: null,
};

export type JournalListAction =
  | { type: 'loadStarted' }
  | { type: 'loadSucceeded'; items: JournalListItemViewModel[]; nextCursor: string | null }
  | { type: 'loadMoreStarted' }
  | { type: 'loadMoreSucceeded'; items: JournalListItemViewModel[]; nextCursor: string | null }
  | { type: 'loadFailed'; error: JournalReadError; phase: JournalListErrorPhase };

function mergeUniqueItems(
  current: JournalListItemViewModel[],
  incoming: JournalListItemViewModel[],
): JournalListItemViewModel[] {
  const seen = new Set<string>();
  const merged: JournalListItemViewModel[] = [];

  for (const item of [...current, ...incoming]) {
    if (seen.has(item.journalId)) continue;
    seen.add(item.journalId);
    merged.push(item);
  }

  return merged;
}

export function journalListReducer(
  state: JournalListState,
  action: JournalListAction,
): JournalListState {
  switch (action.type) {
    case 'loadStarted':
      return {
        ...initialJournalListState,
        status: 'loading',
      };
    case 'loadSucceeded':
      return {
        status: action.items.length === 0 ? 'empty' : 'loaded',
        items: mergeUniqueItems([], action.items),
        nextCursor: action.nextCursor,
        error: null,
        errorPhase: null,
      };
    case 'loadMoreStarted':
      return {
        ...state,
        status: 'loading-more',
        error: null,
        errorPhase: null,
      };
    case 'loadMoreSucceeded': {
      const items = mergeUniqueItems(state.items, action.items);
      return {
        ...state,
        status: items.length === 0 ? 'empty' : 'loaded',
        items,
        nextCursor: action.nextCursor,
        error: null,
        errorPhase: null,
      };
    }
    case 'loadFailed':
      return {
        ...state,
        status: 'error',
        error: action.error,
        errorPhase: action.phase,
      };
  }
}

export { mergeUniqueItems };
