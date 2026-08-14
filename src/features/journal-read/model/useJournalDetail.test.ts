import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { JournalDetailResponse } from '@/features/journal-read/adapter/journalReadResponse';
import type {
  JournalReadPort,
  JournalReadResult,
} from '@/features/journal-read/model/journalReadPort';
import { useJournalDetail } from '@/features/journal-read/model/useJournalDetail';

const FIRST_JOURNAL_ID = '550e8400-e29b-41d4-a716-446655440000';
const SECOND_JOURNAL_ID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

const detailFor = (journalId: string): JournalDetailResponse => ({
  journalId,
  type: 'investment',
  occurredAt: '2026-08-12T14:30:15.123',
  timeZone: 'Asia/Seoul',
  createdAt: '2026-08-12T05:31:02.123Z',
  updatedAt: '2026-08-12T05:31:02.123Z',
  assetName: journalId,
  action: 'buy',
  reasoning: `reason-${journalId}`,
  emotion: null,
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe('useJournalDetail', () => {
  it('ignores a previous route response after the selected id changes', async () => {
    const first = deferred<JournalReadResult<JournalDetailResponse>>();
    const second = deferred<JournalReadResult<JournalDetailResponse>>();
    const detail = vi
      .fn<JournalReadPort['detail']>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const port: JournalReadPort = { detail, list: vi.fn() };
    const hook = renderHook(
      ({ journalId }: { journalId: string }) => useJournalDetail(port, journalId),
      {
        initialProps: { journalId: FIRST_JOURNAL_ID },
      },
    );

    await waitFor(() =>
      expect(detail).toHaveBeenCalledWith(FIRST_JOURNAL_ID, expect.any(AbortSignal)),
    );
    hook.rerender({ journalId: SECOND_JOURNAL_ID });
    await waitFor(() =>
      expect(detail).toHaveBeenCalledWith(SECOND_JOURNAL_ID, expect.any(AbortSignal)),
    );
    const firstSignal = detail.mock.calls[0]?.[1];
    expect(firstSignal?.aborted).toBe(true);

    await act(async () => {
      second.resolve({ ok: true, data: detailFor(SECOND_JOURNAL_ID) });
    });
    await waitFor(() => expect(hook.result.current.state.data?.journalId).toBe(SECOND_JOURNAL_ID));

    await act(async () => {
      first.resolve({ ok: true, data: detailFor(FIRST_JOURNAL_ID) });
    });
    expect(hook.result.current.state.data?.journalId).toBe(SECOND_JOURNAL_ID);
  });

  it('maps a rejecting port to a retryable read_failed state', async () => {
    const detail = vi.fn<JournalReadPort['detail']>().mockRejectedValue(new Error('socket detail'));
    const port: JournalReadPort = { detail, list: vi.fn() };
    const hook = renderHook(() => useJournalDetail(port, FIRST_JOURNAL_ID));

    await waitFor(() => expect(hook.result.current.state.error?.code).toBe('read_failed'));
    expect(hook.result.current.state.status).toBe('error');
  });
});
