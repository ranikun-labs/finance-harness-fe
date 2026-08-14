import { describe, expect, it } from 'vitest';

import {
  isJournalOccurredAt,
  isJournalUtcInstant,
  parseJournalDetailResponse,
  parseJournalListResponse,
} from '@/features/journal-read/adapter/journalReadResponse';

const COMMON_DETAIL = {
  journalId: 'journal-1',
  occurredAt: '2026-08-12T14:30:15.123',
  timeZone: 'Asia/Seoul',
  createdAt: '2026-08-12T05:31:02.123Z',
  updatedAt: '2026-08-12T05:31:02.123Z',
};

describe('journal raw response validation', () => {
  it('accepts an investment detail and preserves nullable emotion', () => {
    expect(
      parseJournalDetailResponse({
        ...COMMON_DETAIL,
        type: 'investment',
        assetName: 'ETF',
        action: 'buy',
        reasoning: 'thesis',
        emotion: null,
      }),
    ).toEqual({
      ...COMMON_DETAIL,
      type: 'investment',
      assetName: 'ETF',
      action: 'buy',
      reasoning: 'thesis',
      emotion: null,
    });
  });

  it('accepts study openQuestions without sorting or deduplicating', () => {
    const openQuestions = ['first', 'same', 'same', 'last'];
    const result = parseJournalDetailResponse({
      ...COMMON_DETAIL,
      type: 'study',
      title: 'Study',
      keyContent: 'content',
      openQuestions,
    });

    expect(result).toMatchObject({ type: 'study', openQuestions });
    expect(result.type === 'study' && result.openQuestions).toEqual(openQuestions);
    expect(result.type === 'study' && result.openQuestions).not.toBe(openQuestions);
  });

  it('validates investment and study summaries without requiring detail fields', () => {
    const result = parseJournalListResponse({
      items: [
        {
          journalId: 'investment-1',
          type: 'investment',
          occurredAt: '2026-08-12T14:30:15.123',
          timeZone: 'Asia/Seoul',
          assetName: 'ETF',
          action: 'buy',
        },
        {
          journalId: 'study-1',
          type: 'study',
          occurredAt: '2026-08-12T14:30:00.000',
          timeZone: 'Asia/Seoul',
          title: 'Study',
        },
      ],
      nextCursor: null,
    });

    expect(result).toEqual({
      items: [
        {
          journalId: 'investment-1',
          type: 'investment',
          occurredAt: '2026-08-12T14:30:15.123',
          timeZone: 'Asia/Seoul',
          assetName: 'ETF',
          action: 'buy',
        },
        {
          journalId: 'study-1',
          type: 'study',
          occurredAt: '2026-08-12T14:30:00.000',
          timeZone: 'Asia/Seoul',
          title: 'Study',
        },
      ],
      nextCursor: null,
    });
  });

  it.each([
    [
      'missing emotion',
      { ...COMMON_DETAIL, type: 'investment', assetName: 'ETF', action: 'buy', reasoning: 'x' },
    ],
    [
      'invalid action',
      {
        ...COMMON_DETAIL,
        type: 'investment',
        assetName: 'ETF',
        action: 'hold',
        reasoning: 'x',
        emotion: null,
      },
    ],
    [
      'invalid occurredAt',
      {
        ...COMMON_DETAIL,
        type: 'investment',
        assetName: 'ETF',
        action: 'buy',
        reasoning: 'x',
        emotion: null,
        occurredAt: '2026-08-12T14:30:15Z',
      },
    ],
    [
      'study non-string question',
      {
        ...COMMON_DETAIL,
        type: 'study',
        title: 'Study',
        keyContent: 'content',
        openQuestions: ['ok', 1],
      },
    ],
    [
      'list total object malformed',
      { items: [{ ...COMMON_DETAIL, type: 'investment' }], nextCursor: null },
    ],
  ])('rejects %s instead of accepting malformed success data', (_label, value) => {
    expect(() =>
      _label === 'list total object malformed'
        ? parseJournalListResponse(value)
        : parseJournalDetailResponse(value),
    ).toThrow('invalid_result');
  });

  it('rejects a missing list cursor and preserves a valid opaque cursor', () => {
    expect(() => parseJournalListResponse({ items: [] })).toThrow('invalid_result');
    expect(parseJournalListResponse({ items: [], nextCursor: 'opaque-token' }).nextCursor).toBe(
      'opaque-token',
    );
  });

  it('validates LocalDateTime and UTC Instant independently', () => {
    expect(isJournalOccurredAt('2026-02-28T23:59:59.999')).toBe(true);
    expect(isJournalOccurredAt('2026-02-29T23:59:59.999')).toBe(false);
    expect(isJournalOccurredAt('2024-02-29T23:59:59.999')).toBe(true);
    expect(isJournalOccurredAt('2026-08-12T14:30:15.123Z')).toBe(false);

    expect(isJournalUtcInstant('2026-08-12T05:31:02.123Z')).toBe(true);
    expect(isJournalUtcInstant('2026-08-12T05:31:02.123+09:00')).toBe(false);
  });
});
