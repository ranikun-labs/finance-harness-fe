import type { JournalCreateCommand } from '@/features/journal-new/model/journalCreateCommand';
import type {
  JournalCreatePort,
  JournalCreateResult,
} from '@/features/journal-new/model/journalCreatePort';

type Options = {
  result?: JournalCreateResult;
  failure?: Error;
  pending?: boolean;
};

type Deferred = {
  resolve: (result: JournalCreateResult) => void;
  reject: (error: Error) => void;
};

/** Test-only port: it never persists, fetches, or mutates fixtures. */
export class DeterministicJournalCreatePort implements JournalCreatePort {
  readonly calls: JournalCreateCommand[] = [];
  private readonly deferred: Deferred[] = [];

  constructor(private readonly options: Options = {}) {}

  create(command: JournalCreateCommand): Promise<JournalCreateResult> {
    this.calls.push(snapshot(command));
    if (this.options.failure) return Promise.reject(this.options.failure);
    if (!this.options.pending) {
      return Promise.resolve(this.options.result ?? { journalId: 'test-journal-001' });
    }
    return new Promise((resolve, reject) => this.deferred.push({ resolve, reject }));
  }

  resolve(
    result: JournalCreateResult = this.options.result ?? { journalId: 'test-journal-001' },
  ): void {
    this.deferred.splice(0).forEach((deferred) => deferred.resolve(result));
  }

  reject(error: Error = new Error('deterministic create failure')): void {
    this.deferred.splice(0).forEach((deferred) => deferred.reject(error));
  }
}

function snapshot(command: JournalCreateCommand): JournalCreateCommand {
  return command.type === 'study'
    ? { ...command, openQuestions: [...command.openQuestions] }
    : { ...command };
}
