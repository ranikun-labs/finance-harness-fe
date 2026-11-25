import type { Locale } from '@/constants/routes';

/**
 * 화면에 보이는 시각 표기 규칙은 이 파일 하나가 소유한다(규칙 문서: `docs/product-policy.md` "시각 표기").
 *
 * - 날짜: 숫자 `YYYY. MM. DD.`(ko) / `MM/DD/YYYY`(en) — 월·일 항상 2자리.
 * - 시각: 날짜 뒤에 `HH:mm`(분까지, 초 없음). 시간 주기는 locale 기본(ko 오전/오후, en AM/PM).
 * - 시간대 이름(IANA·약어·오프셋)은 화면에 보이지 않는다(F1-05 공통 AC 5). 시간대는 값을 어느
 *   벽시계로 읽을지 정할 때만 쓴다.
 * - 저장 시각·도메인 값은 바꾸지 않는다. 원본 값은 호출부가 `<time dateTime>`에 둔다.
 * - 화면은 `Intl.DateTimeFormat`·`toLocale*`를 직접 부르지 않고 아래 함수만 쓴다.
 */
const DATE_PARTS = { year: 'numeric', month: '2-digit', day: '2-digit' } as const;
const DATE_TIME_PARTS = { ...DATE_PARTS, hour: '2-digit', minute: '2-digit' } as const;

/**
 * 서버 instant를 시간대 정보 없이 표시해야 하지만 소속 기록의 시간대가 없는 값(검토 결과·맥락 시점 등)의
 * 읽기 기준. 제품의 서비스 시간대이며 화면에는 이름이 나오지 않는다.
 */
export const DEFAULT_DISPLAY_TIME_ZONE = 'Asia/Seoul';

const ISO_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const JOURNAL_LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/;

/**
 * Returns the current local wall-clock value accepted by a `datetime-local`
 * input. No UTC conversion is performed; the journal transport maps this
 * value together with the runtime IANA timezone.
 */
export function getCurrentLocalDateTimeInput(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join('T');
}

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
  const [, yearStr, monthStr, dayStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const localDate = new Date(year, month - 1, day);
  const isSameCalendarDate =
    localDate.getFullYear() === year &&
    localDate.getMonth() === month - 1 &&
    localDate.getDate() === day;
  if (!isSameCalendarDate) {
    throw new Error(`formatLocalizedDate: "${dateOnly}"는 "YYYY-MM-DD" 형식이 아닙니다.`);
  }
  return new Intl.DateTimeFormat(locale, DATE_PARTS).format(localDate);
}

/**
 * Formats the journal's original local wall-clock value without interpreting it as an
 * instant. A UTC surrogate is used only so Intl can localize the already-separated calendar
 * fields; the original `timeZone` remains a separate product value in the ViewModel.
 */
export function formatJournalOccurredAt(
  occurredAt: string,
  timeZone: string,
  locale: Locale,
): string {
  const match = JOURNAL_LOCAL_DATE_TIME.exec(occurredAt);
  if (!match) {
    throw new Error(`formatJournalOccurredAt: "${occurredAt}"는 LocalDateTime 형식이 아닙니다.`);
  }
  const [, year, month, day, hour, minute, second, millisecond] = match;
  const surrogate = new Date(0);
  surrogate.setUTCFullYear(Number(year), Number(month) - 1, Number(day));
  surrogate.setUTCHours(Number(hour), Number(minute), Number(second), Number(millisecond));

  try {
    // Validate the preserved original zone at the presentation boundary too. The formatter
    // intentionally does not convert the wall-clock fields into this zone.
    new Intl.DateTimeFormat('en-US', { timeZone }).format();
  } catch {
    throw new Error(`formatJournalOccurredAt: invalid IANA timeZone "${timeZone}".`);
  }

  return new Intl.DateTimeFormat(locale, { ...DATE_TIME_PARTS, timeZone: 'UTC' }).format(surrogate);
}

/**
 * 서버가 준 instant(ISO-8601, `Z`·오프셋 포함: createdAt·updatedAt·복기 저장 시각 등)를 지정한 IANA 시간대
 * 기준 벽시계로 표시한다. 시간대는 소속 기록의 `timeZone`을 넘기고, 소속 기록이 없는 값은 생략해
 * `DEFAULT_DISPLAY_TIME_ZONE`을 쓴다. 표시용이며 값은 바꾸지 않는다. 해석할 수 없는 값은 던지지 않고
 * 원문을 돌려준다.
 */
export function formatJournalInstant(
  instant: string,
  timeZone: string | undefined,
  locale: Locale,
): string {
  const parsed = new Date(instant);
  if (Number.isNaN(parsed.getTime())) return instant;
  try {
    return new Intl.DateTimeFormat(locale, {
      ...DATE_TIME_PARTS,
      timeZone: timeZone ?? DEFAULT_DISPLAY_TIME_ZONE,
    }).format(parsed);
  } catch {
    return instant;
  }
}
