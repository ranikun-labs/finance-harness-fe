import type { Locale } from '@/constants/routes';

/**
 * Slice 2의 결과 화면에서만 사용하는 표시용 fixture입니다. 실제 시장 데이터,
 * AI 응답, persistence 계약을 흉내 내지 않도록 모든 문구를 로케일별 상수로
 * 보관하고, 화면은 이 view-model만 소비합니다.
 */
export interface LocalizedText {
  ko: string;
  en: string;
}

export interface ReviewChecklistFixture {
  id: string;
  title: LocalizedText;
  checked: boolean;
}

export interface ReviewFactFixture {
  id: string;
  claim: LocalizedText;
  source: LocalizedText;
  asOf: string;
}

export interface ReviewInferenceFixture {
  id: string;
  text: LocalizedText;
  basis: LocalizedText;
}

export interface ReviewUnknownFixture {
  id: string;
  tag: LocalizedText;
  text: LocalizedText;
}

export interface ReviewResultFixture {
  checklist: ReviewChecklistFixture[];
  facts: ReviewFactFixture[];
  inferences: ReviewInferenceFixture[];
  unknowns: ReviewUnknownFixture[];
  generatedAt: string;
  reviewedAt: string;
}

/**
 * Review → Journal handoff에서만 사용하는 표시용 navigation/view-model입니다.
 * Review API DTO나 persistence payload가 아니며, 사용자가 Editor에서 수정·삭제할
 * 수 있는 초안의 초기값만 담습니다.
 */
export interface ReviewJournalHandoff {
  kind: 'investment' | 'study';
  originalQuestion: string;
  /** Current FE-local originating Review pathname + search/hash. */
  returnTarget: string;
  learningDraft?: {
    title: string;
    keyContent: string;
    openQuestions: string[];
  };
}

const checklist: ReviewChecklistFixture[] = [
  {
    id: 'business-context',
    title: { ko: '사업 맥락과 수익 구조', en: 'Business context and revenue model' },
    checked: false,
  },
  {
    id: 'industry-flow',
    title: { ko: '산업 수요·공급 흐름', en: 'Industry demand and supply flow' },
    checked: false,
  },
  {
    id: 'earnings-assumptions',
    title: { ko: '실적 전제와 기대', en: 'Earnings assumptions and expectations' },
    checked: false,
  },
  {
    id: 'counter-evidence',
    title: { ko: '내 판단을 바꿀 반대 근거', en: 'Counter-evidence that could change my view' },
    checked: false,
  },
];

const facts: ReviewFactFixture[] = [
  {
    id: 'quarterly-revenue',
    claim: {
      ko: '예시 산업의 최근 분기 매출은 전년 대비 증가로 보고됐다.',
      en: 'Recent quarterly revenue in the example industry was reported higher year over year.',
    },
    source: { ko: '예시 출처 · 분기 실적 요약', en: 'Example source · quarterly earnings summary' },
    asOf: '2026-07-31',
  },
  {
    id: 'institutional-flow',
    claim: {
      ko: '최근 1개월 기관 순매수는 유입 우위로 집계됐다.',
      en: 'Institutional net buying was recorded as a net inflow over the past month.',
    },
    source: { ko: '예시 출처 · 시장 집계 요약', en: 'Example source · market flow summary' },
    asOf: '2026-08-07',
  },
];

const inferences: ReviewInferenceFixture[] = [
  {
    id: 'expectations-check',
    text: {
      ko: '매출 증가가 이어져도 기대가 이미 반영됐는지는 별도로 확인해야 한다.',
      en: 'Even if revenue growth continues, whether expectations are already priced in needs a separate check.',
    },
    basis: { ko: '최근 분기 매출', en: 'Recent quarterly revenue' },
  },
  {
    id: 'flow-sustainability',
    text: {
      ko: '기관 순매수가 이어지면 수급은 우호적으로 보일 수 있지만 지속성은 확인이 필요하다.',
      en: 'Continued institutional buying may look supportive, but its persistence still needs checking.',
    },
    basis: { ko: '최근 1개월 기관 순매수', en: 'Recent monthly institutional flow' },
  },
];

const unknowns: ReviewUnknownFixture[] = [
  {
    id: 'pricing-power',
    tag: { ko: '정보 부족', en: 'Information gap' },
    text: {
      ko: '다음 분기 가격 전가가 유지될지는 확인할 수 없다.',
      en: 'It is not possible to confirm whether pricing power will hold next quarter.',
    },
  },
  {
    id: 'freshness',
    tag: { ko: '최신성 부족', en: 'Freshness gap' },
    text: {
      ko: '오늘 이후 새로 반영된 정보가 있는지는 이 예시에서 확인하지 못했다.',
      en: 'This example does not confirm whether information was updated after today.',
    },
  },
];

const partialUnknowns: ReviewUnknownFixture[] = [
  {
    id: 'unverified-source',
    tag: { ko: '확인 불가', en: 'Unable to verify' },
    text: {
      ko: '두 번째 근거는 출처를 확인하지 못해 사실로 제시하지 않았다.',
      en: 'The second piece of evidence could not be sourced, so it is not presented as fact.',
    },
  },
  ...unknowns,
];

export const REVIEW_RESULT_FIXTURE: ReviewResultFixture = {
  checklist,
  facts,
  inferences,
  unknowns,
  generatedAt: '2026-08-10T14:32:00+09:00',
  reviewedAt: '2026-08-10T14:32:00+09:00',
};

export function getReviewFixture(partial = false): ReviewResultFixture {
  return {
    ...REVIEW_RESULT_FIXTURE,
    facts: partial ? REVIEW_RESULT_FIXTURE.facts.slice(0, 1) : REVIEW_RESULT_FIXTURE.facts,
    inferences: partial ? [] : REVIEW_RESULT_FIXTURE.inferences,
    unknowns: partial ? partialUnknowns : REVIEW_RESULT_FIXTURE.unknowns,
    checklist: REVIEW_RESULT_FIXTURE.checklist.map((item) => ({ ...item })),
  };
}

/**
 * 현재 화면에 실제로 표시된 Review fixture만 Journal Editor 초안으로 연결합니다.
 * 해석은 사실로 승격하지 않고 사용자가 편집할 keyContent 초안으로만 전달하며,
 * unknown은 질문 초안으로 유지합니다. 자동 저장이나 전체 결과 복제는 하지 않습니다.
 */
export function createReviewJournalHandoff(
  kind: ReviewJournalHandoff['kind'],
  question: string,
  fixture: ReviewResultFixture,
  locale: Locale,
  returnTarget: string,
): ReviewJournalHandoff {
  const originalQuestion = question.trim();
  if (kind === 'investment') {
    return { kind, originalQuestion, returnTarget };
  }

  return {
    kind,
    originalQuestion,
    returnTarget,
    learningDraft: {
      title: originalQuestion,
      keyContent: fixture.inferences.map((item) => localize(item.text, locale)).join('\n\n'),
      openQuestions: fixture.unknowns.map((item) => localize(item.text, locale)),
    },
  };
}

export function localize(text: LocalizedText, locale: Locale): string {
  return text[locale];
}
