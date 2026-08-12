import type { EmotionTag, RecordAction } from '@/constants/policy';

/** 판단 기록에서 허용된 기록용 행동 식별자. */
export type InvestmentAction = RecordAction;

/** API DTO가 아닌 Journal New 입력 단계의 raw client state. */
export type InvestmentJournalFormState = {
  type: 'investment';
  assetName: string;
  occurredAt: string;
  action: InvestmentAction | '';
  reasoning: string;
  emotion: EmotionTag | '';
};

/** API DTO가 아닌 Journal New 입력 단계의 raw client state. */
export type StudyJournalFormState = {
  type: 'study';
  title: string;
  occurredAt: string;
  keyContent: string;
  openQuestions: string[];
};

export type JournalFormState = InvestmentJournalFormState | StudyJournalFormState;
