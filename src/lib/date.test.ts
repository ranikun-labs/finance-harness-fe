import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { formatLocalizedDate } from '@/lib/date';

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
    expect(formatLocalizedDate('2026-07-20', 'ko')).not.toBe(formatLocalizedDate('2026-07-20', 'en'));
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
});
