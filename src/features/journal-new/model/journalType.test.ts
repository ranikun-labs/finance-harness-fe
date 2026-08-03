import { describe, expect, it } from 'vitest';

import { resolveJournalType } from '@/features/journal-new/model/journalType';

describe('resolveJournalType', () => {
  it.each([
    ['type=investment', { ok: true, type: 'investment' }],
    ['type=study', { ok: true, type: 'study' }],
    ['', { ok: false, reason: 'missing' }],
    ['type=', { ok: false, reason: 'unsupported' }],
    ['type=other', { ok: false, reason: 'unsupported' }],
    ['type=investment&type=study', { ok: false, reason: 'duplicate' }],
    ['type=Investment', { ok: false, reason: 'unsupported' }],
    ['type=%20study%20', { ok: false, reason: 'unsupported' }],
  ])('resolves "%s" without defaulting to investment', (query, expected) => {
    expect(resolveJournalType(new URLSearchParams(query))).toEqual(expected);
  });
});
