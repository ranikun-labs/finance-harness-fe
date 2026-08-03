import type { JournalEntryType } from '@/constants/routes';

/** Journal New 화면이 허용하는 URL type 식별자. */
export type JournalType = JournalEntryType;

/** URL의 `type` query를 기본값 없이 해석한 결과. */
export type JournalTypeResolution =
  { ok: true; type: JournalType } | { ok: false; reason: 'missing' | 'duplicate' | 'unsupported' };

const JOURNAL_TYPES: readonly JournalType[] = ['investment', 'study'];

/**
 * Journal New URL의 type query를 엄격히 해석한다. 잘못된 입력을 investment로
 * 보정하면 사용자가 의도하지 않은 기록 화면에 도달하므로 trim·case 보정·기본값을 두지 않는다.
 */
export function resolveJournalType(searchParams: URLSearchParams): JournalTypeResolution {
  const values = searchParams.getAll('type');

  if (values.length === 0) return { ok: false, reason: 'missing' };
  if (values.length > 1) return { ok: false, reason: 'duplicate' };

  const [value] = values;
  if (!JOURNAL_TYPES.includes(value as JournalType)) {
    return { ok: false, reason: 'unsupported' };
  }

  return { ok: true, type: value as JournalType };
}
