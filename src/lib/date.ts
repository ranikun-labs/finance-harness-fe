import type { Locale } from '@/constants/routes';

const ISO_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * ISO date-only 문자열(`YYYY-MM-DD`)을 locale-aware 표시 문자열로 포맷한다.
 * `new Date(dateOnly)`를 직접 쓰지 않는 이유: 그 형태는 UTC 자정으로 해석되어
 * 음수 timezone에서 실제보다 하루 전날로 표시될 수 있기 때문이다 — 대신 연·월·일을
 * 분해해 local Date를 만들고, `Intl.DateTimeFormat`도 기본적으로 local timezone
 * 기준으로 포맷하므로 두 값이 항상 같은 달력 날짜를 가리킨다.
 */
export function formatLocalizedDate(dateOnly: string, locale: Locale): string {
  const match = ISO_DATE_ONLY.exec(dateOnly);
  if (!match) {
    throw new Error(`formatLocalizedDate: "${dateOnly}"는 "YYYY-MM-DD" 형식이 아닙니다.`);
  }
  const [, year, month, day] = match;
  const localDate = new Date(Number(year), Number(month) - 1, Number(day));
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(localDate);
}
