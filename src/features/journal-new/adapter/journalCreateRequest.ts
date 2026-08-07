import type { EmotionTag, RecordAction } from '@/constants/policy';
import type { JournalCreateCommand } from '@/features/journal-new/model/journalCreateCommand';

export type InvestmentJournalCreateRequest = {
  type: 'investment';
  assetName: string;
  occurredAt: string;
  timeZone: string;
  action: RecordAction;
  reasoning: string;
  emotion?: EmotionTag;
};

export type StudyJournalCreateRequest = {
  type: 'study';
  title: string;
  occurredAt: string;
  timeZone: string;
  keyContent: string;
  openQuestions: string[];
};

export type JournalCreateRequest = InvestmentJournalCreateRequest | StudyJournalCreateRequest;

export function toCreateJournalRequest(
  command: JournalCreateCommand,
  timeZone: string,
): JournalCreateRequest {
  if (command.type === 'investment') {
    const request: InvestmentJournalCreateRequest = {
      type: 'investment',
      assetName: command.assetName,
      occurredAt: command.occurredAt,
      timeZone,
      action: command.action,
      reasoning: command.reasoning,
    };

    if (command.emotion !== undefined) {
      request.emotion = command.emotion;
    }

    return request;
  }

  return {
    type: 'study',
    title: command.title,
    occurredAt: command.occurredAt,
    timeZone,
    keyContent: command.keyContent,
    openQuestions: [...command.openQuestions],
  };
}
