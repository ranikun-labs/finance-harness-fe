import { describe, expect, it } from 'vitest';

import {
  isJournalId,
  isJournalOccurredAt,
  isJournalUtcInstant,
  parseJournalDetailResponse,
  parseJournalListResponse,
} from '@/features/journal-read/adapter/journalReadResponse';

const VALID_JOURNAL_ID = '550e8400-e29b-41d4-a716-446655440000';
const SECOND_JOURNAL_ID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

const COMMON_DETAIL = {
  journalId: VALID_JOURNAL_ID,
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

  it('preserves nonblank durable content exactly as received', () => {
    const reasoning = '  thesis with source spacing  ';
    const keyContent = '\ncontent with source spacing\t';
    const openQuestions = [' first ', 'same', 'same', ' last '];

    const investment = parseJournalDetailResponse({
      ...COMMON_DETAIL,
      type: 'investment',
      assetName: 'ETF',
      action: 'buy',
      reasoning,
      emotion: null,
    });
    const study = parseJournalDetailResponse({
      ...COMMON_DETAIL,
      type: 'study',
      title: 'Study',
      keyContent,
      openQuestions,
    });

    expect(investment.type === 'investment' && investment.reasoning).toBe(reasoning);
    expect(study.type === 'study' && study.keyContent).toBe(keyContent);
    expect(study.type === 'study' && study.openQuestions).toEqual(openQuestions);
  });

  it('validates investment and study summaries without requiring detail fields', () => {
    const result = parseJournalListResponse({
      items: [
        {
          journalId: VALID_JOURNAL_ID,
          type: 'investment',
          occurredAt: '2026-08-12T14:30:15.123',
          timeZone: 'Asia/Seoul',
          assetName: 'ETF',
          action: 'buy',
        },
        {
          journalId: SECOND_JOURNAL_ID,
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
          journalId: VALID_JOURNAL_ID,
          type: 'investment',
          occurredAt: '2026-08-12T14:30:15.123',
          timeZone: 'Asia/Seoul',
          assetName: 'ETF',
          action: 'buy',
        },
        {
          journalId: SECOND_JOURNAL_ID,
          type: 'study',
          occurredAt: '2026-08-12T14:30:00.000',
          timeZone: 'Asia/Seoul',
          title: 'Study',
        },
      ],
      nextCursor: null,
    });
  });

  it.each(['journal-1', '', '550e8400-e29b-41d4-a716-44665544000z'])(
    'rejects malformed detail journalId %j',
    (journalId) => {
      expect(() =>
        parseJournalDetailResponse({
          ...COMMON_DETAIL,
          journalId,
          type: 'investment',
          assetName: 'ETF',
          action: 'buy',
          reasoning: 'thesis',
          emotion: null,
        }),
      ).toThrow('invalid_result');
    },
  );

  it.each(['journal-1', '', '550e8400-e29b-41d4-a716-44665544000z'])(
    'rejects malformed list summary journalId %j',
    (journalId) => {
      expect(() =>
        parseJournalListResponse({
          items: [
            {
              journalId,
              type: 'investment',
              occurredAt: '2026-08-12T14:30:15.123',
              timeZone: 'Asia/Seoul',
              assetName: 'ETF',
              action: 'buy',
            },
          ],
          nextCursor: null,
        }),
      ).toThrow('invalid_result');
    },
  );

  it.each([
    [
      'malformed detail journalId',
      {
        ...COMMON_DETAIL,
        journalId: 'journal-1',
        type: 'investment',
        assetName: 'ETF',
        action: 'buy',
        reasoning: 'x',
        emotion: null,
      },
    ],
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

  it.each([
    [
      'investment empty reasoning',
      {
        ...COMMON_DETAIL,
        type: 'investment',
        assetName: 'ETF',
        action: 'buy',
        reasoning: '',
        emotion: null,
      },
    ],
    [
      'investment whitespace reasoning',
      {
        ...COMMON_DETAIL,
        type: 'investment',
        assetName: 'ETF',
        action: 'buy',
        reasoning: ' \n\t',
        emotion: null,
      },
    ],
    [
      'study empty keyContent',
      { ...COMMON_DETAIL, type: 'study', title: 'Study', keyContent: '', openQuestions: ['valid'] },
    ],
    [
      'study whitespace keyContent',
      {
        ...COMMON_DETAIL,
        type: 'study',
        title: 'Study',
        keyContent: ' \n\t',
        openQuestions: ['valid'],
      },
    ],
    [
      'study empty open question',
      {
        ...COMMON_DETAIL,
        type: 'study',
        title: 'Study',
        keyContent: 'content',
        openQuestions: ['valid', ''],
      },
    ],
    [
      'study whitespace open question',
      {
        ...COMMON_DETAIL,
        type: 'study',
        title: 'Study',
        keyContent: 'content',
        openQuestions: ['valid', ' \n\t'],
      },
    ],
  ])('rejects %s as malformed durable content', (_label, value) => {
    expect(() => parseJournalDetailResponse(value)).toThrow('invalid_result');
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

    expect(isJournalId(VALID_JOURNAL_ID)).toBe(true);
    expect(isJournalId('journal-1')).toBe(false);
    expect(isJournalId('')).toBe(false);
    expect(isJournalId('550e8400-e29b-41d4-a716-44665544000z')).toBe(false);

    expect(isJournalUtcInstant('2026-08-12T05:31:02Z')).toBe(true);
    expect(isJournalUtcInstant('2026-08-12T05:31:02.123Z')).toBe(true);
    expect(isJournalUtcInstant('2026-08-12T05:31:02.123456Z')).toBe(true);
    expect(isJournalUtcInstant('2026-08-12T05:31:02.123456789Z')).toBe(true);
    expect(isJournalUtcInstant('2026-08-12T05:31:02.123+09:00')).toBe(false);
    expect(isJournalUtcInstant('2026-08-12T05:31:02.123')).toBe(false);
    expect(isJournalUtcInstant('2026-08-12T05:31:02.123Z\n')).toBe(false);
    expect(isJournalUtcInstant('2026-02-30T05:31:02Z')).toBe(false);
  });
});
