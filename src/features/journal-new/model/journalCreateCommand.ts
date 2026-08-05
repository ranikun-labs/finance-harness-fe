import type { EmotionTag, RecordAction } from '@/constants/policy';
import type {
  InvestmentJournalFormState,
  StudyJournalFormState,
} from '@/features/journal-new/model/journalFormTypes';

/** API DTO와 분리된, 검증된 Journal New 입력의 생성 의도다. */
export type InvestmentJournalCreateCommand = {
  type: 'investment';
  assetName: string;
  occurredAt: string;
  action: RecordAction;
  reasoning: string;
  emotion?: EmotionTag;
};

/** API DTO와 분리된, 검증된 Journal New 입력의 생성 의도다. */
export type StudyJournalCreateCommand = {
  type: 'study';
  title: string;
  occurredAt: string;
  keyContent: string;
  openQuestions: string[];
};

export type JournalCreateCommand = InvestmentJournalCreateCommand | StudyJournalCreateCommand;

export function toInvestmentJournalCreateCommand(
  state: InvestmentJournalFormState,
): InvestmentJournalCreateCommand {
  return {
    type: 'investment',
    assetName: state.assetName.trim(),
    occurredAt: state.occurredAt,
    action: state.action as RecordAction,
    reasoning: state.reasoning.trim(),
    emotion: state.emotion === '' ? undefined : state.emotion,
  };
}

export function toStudyJournalCreateCommand(
  state: StudyJournalFormState,
): StudyJournalCreateCommand {
  return {
    type: 'study',
    title: state.title.trim(),
    occurredAt: state.occurredAt,
    keyContent: state.keyContent.trim(),
    openQuestions: state.openQuestions.map((question) => question.trim()).filter(Boolean),
  };
}
