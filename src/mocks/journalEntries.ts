import type { EmotionTag, RecordAction } from '@/constants/policy';
import type { SampleSubjectKey } from '@/i18n/dictionary';
import type { DecisionContextSnapshot } from '@/mocks/decisionContext';
import { SAMPLE_DECISION_CONTEXT } from '@/mocks/decisionContext';

export interface JournalChecklistItem {
  text: string;
  checked: boolean;
}

interface BaseJournalEntry {
  id: string;
  recordedAt: string;
  question: string;
  memo: string;
  emotion?: EmotionTag;
  checkedCount: number;
  totalCount: number;
  decisionContext?: DecisionContextSnapshot;
}

type InvestmentJournalEntry = BaseJournalEntry & {
  type: 'investment';
  subjectKey: SampleSubjectKey;
  action: RecordAction;
  aiChecklist: string[];
  decisionChecks: JournalChecklistItem[];
};

type StudyJournalEntry = BaseJournalEntry & {
  type: 'study';
  title: string;
  nextChecks: JournalChecklistItem[];
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
    decisionContext: SAMPLE_DECISION_CONTEXT,
    checkedCount: 2,
    totalCount: 3,
    aiChecklist: [
      '반도체 업황 — HBM·AI 수요 기대가 유지되는지',
      '외국인 수급 — 하루짜리인지 누적 흐름인지',
      '월말 리밸런싱 — 기관 수급 변동성 구간인지',
      '실적 기대 — 이미 가격에 반영됐는지',
    ],
    decisionChecks: [
      { text: '외국인 수급이 누적 흐름인지 확인했다', checked: true },
      { text: '반도체 업황 지속 여부를 점검했다', checked: true },
      { text: '월말 리밸런싱 구간 여부를 확인했다', checked: false },
    ],
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
    nextChecks: [
      { text: '외국인 수급 흐름을 다시 확인한다', checked: true },
      { text: '기관 수급과 벤치마크 조정을 비교한다', checked: true },
      { text: '다음 실적 발표 일정을 확인한다', checked: true },
    ],
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
    aiChecklist: [
      '정책 환경 — 지원 정책의 방향이 유지되는지',
      '수요 흐름 — 단기 반등과 누적 수요를 구분했는지',
      '실적 전제 — 기대와 실제 수치의 차이가 있는지',
      '반대 근거 — 판단을 바꿀 신호를 확인했는지',
    ],
    decisionChecks: [
      { text: '관련 정책의 최근 변화를 확인했다', checked: true },
      { text: '수요 회복이 누적 흐름인지 확인했다', checked: false },
      { text: '실적 발표 전제를 다시 점검했다', checked: false },
      { text: '판단을 바꿀 반대 근거를 정리했다', checked: false },
    ],
  },
];
