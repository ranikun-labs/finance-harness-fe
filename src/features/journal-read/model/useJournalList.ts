import { useCallback, useEffect, useRef, useState } from 'react';

import type { JournalListResponse } from '@/features/journal-read/adapter/journalReadResponse';
import type { JournalReadPort } from '@/features/journal-read/model/journalReadPort';
import {
  initialJournalListState,
  journalListReducer,
  type JournalListState,
} from '@/features/journal-read/model/journalListState';
import { toJournalListViewModels } from '@/features/journal-read/model/journalReadViewModel';

export const JOURNAL_LIST_DEFAULT_LIMIT = 20;

export interface UseJournalListOptions {
  port: JournalReadPort;
  limit?: number;
}

export interface UseJournalListResult {
  state: JournalListState;
  retry: () => void;
  loadMore: () => void;
}

export function useJournalList({
  port,
  limit = JOURNAL_LIST_DEFAULT_LIMIT,
}: UseJournalListOptions) {
  const [state, setState] = useState<JournalListState>(initialJournalListState);
  const stateRef = useRef(state);
  const requestIdRef = useRef(0);
  const activeRequestRef = useRef<AbortController | null>(null);
  const moreRequestRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const loadInitial = useCallback(() => {
    activeRequestRef.current?.abort();
    const controller = new AbortController();
    activeRequestRef.current = controller;
    moreRequestRef.current = false;
    const requestId = ++requestIdRef.current;
    setState((current) => journalListReducer(current, { type: 'loadStarted' }));

    void Promise.resolve()
      .then(() => port.list({ limit, signal: controller.signal }))
      .then((result) => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return;
        if (result.ok === false) {
          setState((current) =>
            journalListReducer(current, {
              type: 'loadFailed',
              error: result.error,
              phase: 'initial',
            }),
          );
          return;
        }
        setState((current) => journalListReducer(current, toLoadSucceeded(result.data)));
      })
      .catch(() => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return;
        setState((current) =>
          journalListReducer(current, {
            type: 'loadFailed',
            error: { code: 'read_failed' },
            phase: 'initial',
          }),
        );
      });
  }, [limit, port]);

  const loadMore = useCallback(() => {
    const current = stateRef.current;
    if (
      current.nextCursor === null ||
      current.status === 'loading' ||
      current.status === 'loading-more' ||
      moreRequestRef.current
    ) {
      return;
    }

    const cursor = current.nextCursor;
    const controller = new AbortController();
    activeRequestRef.current?.abort();
    activeRequestRef.current = controller;
    moreRequestRef.current = true;
    const requestId = ++requestIdRef.current;
    setState((latest) => journalListReducer(latest, { type: 'loadMoreStarted' }));

    void Promise.resolve()
      .then(() => port.list({ limit, cursor, signal: controller.signal }))
      .then((result) => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return;
        moreRequestRef.current = false;
        if (result.ok === false) {
          setState((latest) =>
            journalListReducer(latest, {
              type: 'loadFailed',
              error: result.error,
              phase: 'load-more',
            }),
          );
          return;
        }
        setState((latest) => journalListReducer(latest, toLoadMoreSucceeded(result.data)));
      })
      .catch(() => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return;
        moreRequestRef.current = false;
        setState((latest) =>
          journalListReducer(latest, {
            type: 'loadFailed',
            error: { code: 'read_failed' },
            phase: 'load-more',
          }),
        );
      });
  }, [limit, port]);

  const retry = useCallback(() => {
    if (stateRef.current.errorPhase === 'load-more') {
      loadMore();
      return;
    }
    loadInitial();
  }, [loadInitial, loadMore]);

  useEffect(() => {
    let mounted = true;
    void Promise.resolve().then(() => {
      if (mounted) loadInitial();
    });
    return () => {
      mounted = false;
      activeRequestRef.current?.abort();
      requestIdRef.current += 1;
      moreRequestRef.current = false;
    };
  }, [loadInitial]);

  return { state, retry, loadMore } satisfies UseJournalListResult;
}

function toLoadSucceeded(response: JournalListResponse) {
  return {
    type: 'loadSucceeded' as const,
    items: toJournalListViewModels(response.items),
    nextCursor: response.nextCursor,
  };
}

function toLoadMoreSucceeded(response: JournalListResponse) {
  return {
    type: 'loadMoreSucceeded' as const,
    items: toJournalListViewModels(response.items),
    nextCursor: response.nextCursor,
  };
}
