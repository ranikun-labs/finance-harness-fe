import type { JournalCreateCommand } from '@/features/journal-new/model/journalCreateCommand';

export type JournalCreateResult = {
  journalId: string;
};

export type JournalCreateErrorCode =
  'create_failed' | 'invalid_result' | 'invalid_request' | 'idempotency_conflict' | 'network_error';

export class JournalCreatePortError extends Error {
  constructor(readonly code: JournalCreateErrorCode) {
    super(code);
    this.name = 'JournalCreatePortError';
  }
}

export interface JournalCreatePort {
  create(command: JournalCreateCommand, idempotencyKey: string): Promise<JournalCreateResult>;
}
