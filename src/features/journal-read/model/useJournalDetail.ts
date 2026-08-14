import { useCallback, useEffect, useState } from 'react';

import type {
  JournalReadError,
  JournalReadPort,
} from '@/features/journal-read/model/journalReadPort';
import type { JournalDetailViewModel } from '@/features/journal-read/model/journalReadViewModel';
import { toJournalDetailViewModel } from '@/features/journal-read/model/journalReadViewModel';

export type JournalDetailStatus = 'loading' | 'success' | 'error';

export interface JournalDetailState {
  status: JournalDetailStatus;
  data: JournalDetailViewModel | null;
  error: JournalReadError | null;
}

export interface UseJournalDetailResult {
  state: JournalDetailState;
  retry: () => void;
}

export function useJournalDetail(
  port: JournalReadPort,
  journalId: string | undefined,
): UseJournalDetailResult {
  const [retryToken, setRetryToken] = useState(0);
  const [state, setState] = useState<JournalDetailState>({
    status: 'loading',
    data: null,
    error: null,
  });

  const retry = useCallback(() => setRetryToken((token) => token + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    void Promise.resolve().then(async () => {
      if (!active || controller.signal.aborted) return;

      if (journalId === undefined || journalId.trim() === '') {
        setState({
          status: 'error',
          data: null,
          error: { code: 'invalid_request', status: 400 },
        });
        return;
      }

      setState({ status: 'loading', data: null, error: null });
      try {
        const result = await port.detail(journalId, controller.signal);
        if (!active || controller.signal.aborted) return;
        if (result.ok === false) {
          setState({ status: 'error', data: null, error: result.error });
          return;
        }
        setState({
          status: 'success',
          data: toJournalDetailViewModel(result.data),
          error: null,
        });
      } catch {
        if (!active || controller.signal.aborted) return;
        setState({
          status: 'error',
          data: null,
          error: { code: 'read_failed' },
        });
      }
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [journalId, port, retryToken]);

  return { state, retry };
}
