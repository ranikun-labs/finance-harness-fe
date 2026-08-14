import { describe, expect, it } from 'vitest';

import {
  initialJournalListState,
  journalListReducer,
} from '@/features/journal-read/model/journalListState';
import type { JournalListItemViewModel } from '@/features/journal-read/model/journalReadViewModel';

const JOURNAL_ONE = '550e8400-e29b-41d4-a716-446655440000';
const JOURNAL_TWO = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

const investment: JournalListItemViewModel = {
  journalId: JOURNAL_ONE,
  type: 'investment',
  occurredAt: '2026-08-12T14:30:15.123' as JournalListItemViewModel['occurredAt'],
  timeZone: 'Asia/Seoul',
  assetName: 'ETF',
  action: 'buy',
};

const study: JournalListItemViewModel = {
  journalId: JOURNAL_TWO,
  type: 'study',
  occurredAt: '2026-08-12T14:30:00.000' as JournalListItemViewModel['occurredAt'],
  timeZone: 'Asia/Seoul',
  title: 'Study',
};

describe('journalListReducer', () => {
  it('keeps first-page cursor and marks terminal empty responses as empty', () => {
    expect(
      journalListReducer(initialJournalListState, {
        type: 'loadSucceeded',
        items: [],
        nextCursor: null,
      }),
    ).toMatchObject({ status: 'empty', items: [], nextCursor: null });
  });

  it('appends pages while suppressing duplicate journal ids', () => {
    const first = journalListReducer(initialJournalListState, {
      type: 'loadSucceeded',
      items: [investment, study],
      nextCursor: 'next-1',
    });
    const more = journalListReducer(first, { type: 'loadMoreStarted' });
    const final = journalListReducer(more, {
      type: 'loadMoreSucceeded',
      items: [investment, { ...study, title: 'newer duplicate body' }],
      nextCursor: null,
    });

    expect(final.status).toBe('loaded');
    expect(final.items.map((item) => item.journalId)).toEqual([JOURNAL_ONE, JOURNAL_TWO]);
    expect(final.items[1]).toEqual(study);
    expect(final.nextCursor).toBeNull();
  });

  it('preserves loaded items when continuation fails and records retry phase', () => {
    const loaded = journalListReducer(initialJournalListState, {
      type: 'loadSucceeded',
      items: [investment],
      nextCursor: 'next-1',
    });
    const failed = journalListReducer(loaded, {
      type: 'loadFailed',
      error: { code: 'read_failed', status: 500 },
      phase: 'load-more',
    });
    expect(failed).toMatchObject({
      status: 'error',
      items: [investment],
      nextCursor: 'next-1',
      errorPhase: 'load-more',
    });
  });
});
