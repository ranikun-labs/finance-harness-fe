import type { JournalCreateCommand } from '@/features/journal-new/model/journalCreateCommand';

export type JournalCreateResult = {
  journalId: string;
};

export type JournalCreateErrorCode = 'create_failed' | 'invalid_result';

export interface JournalCreatePort {
  create(command: JournalCreateCommand): Promise<JournalCreateResult>;
}
