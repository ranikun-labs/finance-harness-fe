import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { JournalListResponse } from '@/features/journal-read/adapter/journalReadResponse';
import type {
  JournalReadPort,
  JournalReadResult,
} from '@/features/journal-read/model/journalReadPort';
import { useJournalList } from '@/features/journal-read/model/useJournalList';

const JOURNAL_ONE = '550e8400-e29b-41d4-a716-446655440000';
const JOURNAL_TWO = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const JOURNAL_NEW = '7d444840-9dc0-11d1-b245-5ffdce74fad2';
const JOURNAL_STALE = '8f7c2e1a-2c1a-4f53-9f5f-7d7e4f1a2b3c';

const firstPage: JournalListResponse = {
  items: [
    {
      journalId: JOURNAL_ONE,
      type: 'investment',
      occurredAt: '2026-08-12T14:30:15.123',
      timeZone: 'Asia/Seoul',
      assetName: 'ETF',
      action: 'buy',
    },
  ],
  nextCursor: 'opaque/cursor?1',
};

const secondPage: JournalListResponse = {
  items: [
    {
      journalId: JOURNAL_ONE,
      type: 'investment',
      occurredAt: '2026-08-12T14:30:15.123',
      timeZone: 'Asia/Seoul',
      assetName: 'ETF',
      action: 'buy',
    },
    {
      journalId: JOURNAL_TWO,
      type: 'study',
      occurredAt: '2026-08-12T14:30:00.000',
      timeZone: 'Asia/Seoul',
      title: 'Study',
    },
  ],
  nextCursor: null,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe('useJournalList', () => {
  it('requests the next opaque cursor and suppresses duplicate presentation', async () => {
    const initial = Promise.resolve<JournalReadResult<JournalListResponse>>({
      ok: true,
      data: firstPage,
    });
    const more = Promise.resolve<JournalReadResult<JournalListResponse>>({
      ok: true,
      data: secondPage,
    });
    const list = vi
      .fn<JournalReadPort['list']>()
      .mockReturnValueOnce(initial)
      .mockReturnValueOnce(more);
    const port: JournalReadPort = { list, detail: vi.fn() };
    const hook = renderHook(() => useJournalList({ port }));

    await waitFor(() => expect(hook.result.current.state.status).toBe('loaded'));
    expect(hook.result.current.state.items).toHaveLength(1);
    expect(hook.result.current.state.nextCursor).toBe('opaque/cursor?1');

    await act(async () => {
      hook.result.current.loadMore();
    });
    await waitFor(() => expect(hook.result.current.state.items).toHaveLength(2));
    expect(list.mock.calls[1]?.[0]).toMatchObject({ limit: 20, cursor: 'opaque/cursor?1' });
    expect(hook.result.current.state.nextCursor).toBeNull();
  });

  it('ignores a stale initial response when the port changes', async () => {
    const oldRequest = deferred<JournalReadResult<JournalListResponse>>();
    const oldList = vi.fn<JournalReadPort['list']>().mockReturnValue(oldRequest.promise);
    const newList = vi.fn<JournalReadPort['list']>().mockResolvedValue({
      ok: true,
      data: {
        items: [
          {
            journalId: JOURNAL_NEW,
            type: 'study',
            occurredAt: '2026-08-12T14:30:00.000',
            timeZone: 'Asia/Seoul',
            title: 'New response',
          },
        ],
        nextCursor: null,
      },
    });
    const oldPort: JournalReadPort = { list: oldList, detail: vi.fn() };
    const newPort: JournalReadPort = { list: newList, detail: vi.fn() };
    const hook = renderHook(({ port }: { port: JournalReadPort }) => useJournalList({ port }), {
      initialProps: { port: oldPort },
    });

    await waitFor(() => expect(oldList).toHaveBeenCalled());
    hook.rerender({ port: newPort });
    await waitFor(() => expect(hook.result.current.state.items[0]?.journalId).toBe(JOURNAL_NEW));
    expect(oldList.mock.calls[0]?.[0]?.signal?.aborted).toBe(true);

    await act(async () => {
      oldRequest.resolve({
        ok: true,
        data: {
          items: [
            {
              journalId: JOURNAL_STALE,
              type: 'study',
              occurredAt: '2026-08-12T14:30:00.000',
              timeZone: 'Asia/Seoul',
              title: 'Stale response',
            },
          ],
          nextCursor: null,
        },
      });
    });
    expect(hook.result.current.state.items[0]?.journalId).toBe(JOURNAL_NEW);
  });
});
