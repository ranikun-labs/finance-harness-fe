import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_DISPLAY_TIME_ZONE,
  formatJournalInstant,
  formatJournalOccurredAt,
  formatLocalizedDate,
} from '@/lib/date';

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

describe('formatJournalInstant', () => {
  it('shows the instant in the record time zone without the ISO string', () => {
    const ko = formatJournalInstant('2026-08-12T05:31:02.123Z', 'Asia/Seoul', 'ko');
    expect(ko).not.toContain('2026-08-12T');
    expect(ko).toContain('02:31');
    expect(formatJournalInstant('2026-08-12T05:31:02.123Z', 'Asia/Seoul', 'en')).toContain(
      '02:31 PM',
    );
  });

  it('falls back to the raw value instead of throwing on unparsable input', () => {
    expect(formatJournalInstant('not-a-date', 'Asia/Seoul', 'ko')).toBe('not-a-date');
    expect(formatJournalInstant('2026-08-12T05:31:02.123Z', 'Not/AZone', 'ko')).toBe(
      '2026-08-12T05:31:02.123Z',
    );
  });
});

describe('single visible time notation', () => {
  const INSTANT = '2026-08-12T05:31:02.123Z';
  const WALL_CLOCK = '2026-08-12T14:31:00.000';

  it.each(['ko', 'en'] as const)(
    'renders a wall-clock value and the same instant read in its zone identically (%s)',
    (locale) => {
      // 기록 시점(벽시계)과 생성/수정(instant)·복기 저장 시각이 같은 규칙이라 같은 시각이면 같은 글자다.
      expect(formatJournalInstant(INSTANT, 'Asia/Seoul', locale)).toBe(
        formatJournalOccurredAt(WALL_CLOCK, 'Asia/Seoul', locale),
      );
    },
  );

  it('pads month, day and hour to two digits with minutes and no seconds', () => {
    // ICU에 따라 ko의 구분자·오전/오후 표기가 다르므로 숫자 토큰만 대조한다.
    expect(digitTokens(formatJournalInstant('2026-01-02T00:05:09Z', 'UTC', 'ko'))).toEqual([
      '2026',
      '01',
      '02',
      '12',
      '05',
    ]);
    expect(digitTokens(formatJournalInstant('2026-01-02T00:05:09Z', 'UTC', 'en'))).toEqual([
      '01',
      '02',
      '2026',
      '12',
      '05',
    ]);
  });

  it('reads the instant in the record zone, or the product default zone when it has no record', () => {
    const inRecordZone = formatJournalInstant(INSTANT, 'America/New_York', 'en');
    expect(inRecordZone).toContain('01:31 AM');
    expect(formatJournalInstant(INSTANT, undefined, 'en')).toBe(
      formatJournalInstant(INSTANT, DEFAULT_DISPLAY_TIME_ZONE, 'en'),
    );
    expect(formatJournalInstant(INSTANT, undefined, 'en')).toContain('02:31 PM');
  });

  it.each(['ko', 'en'] as const)('never prints a time zone name or offset (%s)', (locale) => {
    const text = formatJournalInstant(INSTANT, 'Asia/Seoul', locale);
    expect(text).not.toMatch(/Asia|Seoul|KST|GMT|UTC|[+-]\d{2}:?\d{2}|표준시/);
  });

  it('is the only place that formats a visible date or time', () => {
    // 화면 코드가 Intl·toLocale*를 직접 부르면 규칙이 다시 갈라진다. 검증(IANA 유효성)·전송용 사용만 예외다.
    const allowed = new Set([
      'src/lib/date.ts',
      'src/features/journal-read/adapter/journalReadResponse.ts',
      'src/features/journal-new/adapter/productionJournalCreatePort.ts',
    ]);
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (
          /\.(ts|tsx)$/.test(name) &&
          !/\.test\.(ts|tsx)$/.test(name) &&
          !allowed.has(path) &&
          /DateTimeFormat|toLocale(Date|Time)?String/.test(readFileSync(path, 'utf8'))
        )
          offenders.push(path);
      }
    };
    walk('src');
    expect(offenders).toEqual([]);
  });
});
