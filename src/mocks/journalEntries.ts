import type { EmotionTag, RecordAction } from '@/constants/policy';
import type { SampleSubjectKey } from '@/i18n/dictionary';

interface BaseJournalEntry {
  id: string;
  recordedAt: string;
  question: string;
  memo: string;
  emotion?: EmotionTag;
  checkedCount: number;
  totalCount: number;
}

type InvestmentJournalEntry = BaseJournalEntry & {
  type: 'investment';
  subjectKey: SampleSubjectKey;
  action: RecordAction;
};

type StudyJournalEntry = BaseJournalEntry & {
  type: 'study';
  title: string;
};

export type JournalEntry = InvestmentJournalEntry | StudyJournalEntry;

/**
 * 실존 종목명·티커·시세를 쓰지 않는 중립 mock 데이터. `recordedAt`은
 * locale-independent ISO date-only 문자열이다 — 표시용 포맷은
 * `formatLocalizedDate`가 렌더 시점에 담당한다.
 */
export const JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'journal-2026-06-28-01',
    type: 'investment',
    subjectKey: 'semiconductorCompanyA',
    action: 'interest',
    recordedAt: '2026-06-28',
    question: '반도체 기업 A 요즘 어때?',
    memo: 'HBM 수요 기대가 꺾이지 않았고, 외국인 누적 매수가 며칠째 이어지고 있어서 지켜보기로 했다.',
    emotion: '확신',
    checkedCount: 2,
    totalCount: 3,
  },
  {
    id: 'journal-2026-06-27-01',
    type: 'study',
    title: '월말 리밸런싱',
    recordedAt: '2026-06-27',
    question: '월말·분기말에 기관은 왜 리밸런싱하나?',
    memo: '펀드 벤치마크 대비 비중 조정이 필요해 월말에 기관 수급이 크게 튀는 경향이 있다. 단기 수급 왜곡으로 오해할 수 있음.',
    checkedCount: 3,
    totalCount: 3,
  },
  {
    id: 'journal-2026-06-24-01',
    type: 'investment',
    subjectKey: 'batteryCompanyC',
    action: 'watching',
    recordedAt: '2026-06-24',
    question: '배터리 기업 C 지금 들어가도 될까?',
    memo: '2차전지 정책 불확실성이 아직 남아 있어 지금은 지켜보기로 했다. 추가 체크 후 재검토 예정.',
    emotion: '불안',
    checkedCount: 1,
    totalCount: 4,
  },
];
