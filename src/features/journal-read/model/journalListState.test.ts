import { describe, expect, it } from 'vitest';

import {
  initialJournalListState,
  journalListReducer,
} from '@/features/journal-read/model/journalListState';
import type { JournalListItemViewModel } from '@/features/journal-read/model/journalReadViewModel';

const investment: JournalListItemViewModel = {
  journalId: 'journal-1',
  type: 'investment',
  occurredAt: '2026-08-12T14:30:15.123' as JournalListItemViewModel['occurredAt'],
  timeZone: 'Asia/Seoul',
  assetName: 'ETF',
  action: 'buy',
};

const study: JournalListItemViewModel = {
  journalId: 'journal-2',
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
    expect(final.items.map((item) => item.journalId)).toEqual(['journal-1', 'journal-2']);
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
