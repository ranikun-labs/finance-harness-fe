import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { formatJournalOccurredAt, formatLocalizedDate } from '@/lib/date';

/** 포맷 결과에서 숫자 토큰(연/월/일)만 뽑아낸다 — ICU 버전에 따라 달라지는 구분자·
 * 순서에 의존하지 않고 "며칠"이 실제로 맞는지만 검증하기 위함이다. */
function digitTokens(formatted: string): string[] {
  return formatted.match(/\d+/g) ?? [];
}

describe('formatLocalizedDate', () => {
  it('does not render the raw ISO string as-is', () => {
    expect(formatLocalizedDate('2026-07-20', 'ko')).not.toBe('2026-07-20');
    expect(formatLocalizedDate('2026-07-20', 'en')).not.toBe('2026-07-20');
  });

  it('produces different output for ko and en', () => {
    expect(formatLocalizedDate('2026-07-20', 'ko')).not.toBe(
      formatLocalizedDate('2026-07-20', 'en'),
    );
  });

  it('keeps the same calendar date (year/month/day tokens) in both locales', () => {
    for (const locale of ['ko', 'en'] as const) {
      const tokens = digitTokens(formatLocalizedDate('2026-01-05', locale));
      expect(tokens).toContain('2026');
      expect(tokens).toContain('05');
    }
  });

  describe('in a negative UTC-offset timezone', () => {
    const originalTz = process.env.TZ;

    beforeEach(() => {
      process.env.TZ = 'America/Los_Angeles';
    });

    afterEach(() => {
      process.env.TZ = originalTz;
    });

    it('does not shift the date back a day', () => {
      const tokens = digitTokens(formatLocalizedDate('2026-07-20', 'en'));
      expect(tokens).toContain('20');
      expect(tokens).not.toContain('19');
    });
  });

  it('throws on a malformed date-only string', () => {
    expect(() => formatLocalizedDate('2026/07/20', 'ko')).toThrow();
    expect(() => formatLocalizedDate('not-a-date', 'ko')).toThrow();
  });

  it.each([
    ['2024-02-29', 'leap year Feb 29'],
    ['2026-02-28', 'non-leap year Feb 28'],
    ['2026-01-31', '31-day month'],
  ])('accepts the valid calendar date %s (%s)', (dateOnly) => {
    expect(() => formatLocalizedDate(dateOnly, 'ko')).not.toThrow();
  });

  it.each([
    ['2025-02-29', 'Feb 29 in a non-leap year'],
    ['2026-02-29', 'Feb 29 in a non-leap year'],
    ['2026-02-31', 'Feb 31 does not exist'],
    ['2026-04-31', 'April only has 30 days'],
    ['2026-13-01', 'month 13 is invalid'],
    ['2026-00-10', 'month 00 is invalid'],
    ['2026-01-00', 'day 00 is invalid'],
  ])(
    'rejects the calendar-invalid date %s (%s) instead of silently rolling it over',
    (dateOnly) => {
      expect(() => formatLocalizedDate(dateOnly, 'ko')).toThrow();
    },
  );
});

describe('formatJournalOccurredAt', () => {
  it('preserves the original wall-clock value instead of converting it through UTC', () => {
    const formatted = formatJournalOccurredAt('2026-08-12T14:30:15.123', 'Asia/Seoul', 'en');
    expect(formatted).not.toContain('2026-08-12T14:30:15.123');
    expect(formatted).toContain('08/12/2026');
    expect(formatted).toContain('02:30 PM');
  });

  it('rejects a timestamp carrying an offset or Z', () => {
    expect(() => formatJournalOccurredAt('2026-08-12T14:30:15.123Z', 'Asia/Seoul', 'ko')).toThrow();
  });
});
