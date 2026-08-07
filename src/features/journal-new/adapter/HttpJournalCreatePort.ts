import type { JournalCreateCommand } from '@/features/journal-new/model/journalCreateCommand';
import type {
  JournalCreatePort,
  JournalCreateResult,
} from '@/features/journal-new/model/journalCreatePort';
import { toCreateJournalRequest } from '@/features/journal-new/adapter/journalCreateRequest';

export type JournalFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type HttpJournalCreatePortOptions = {
  fetchImpl: JournalFetch;
  timeZone: string;
};

const INVALID_RESULT: JournalCreateResult = { journalId: '' };

export class HttpJournalCreatePort implements JournalCreatePort {
  private readonly fetchImpl: JournalFetch;

  private readonly timeZone: string;

  constructor({ fetchImpl, timeZone }: HttpJournalCreatePortOptions) {
    this.fetchImpl = fetchImpl;
    this.timeZone = timeZone;
  }

  async create(command: JournalCreateCommand): Promise<JournalCreateResult> {
    const request = toCreateJournalRequest(command, this.timeZone);
    let response: Response;

    try {
      response = await this.fetchImpl('/finance/journals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
    } catch {
      throw createFailedError();
    }

    if (response.status < 200 || response.status >= 300) {
      throw createFailedError();
    }

    if (response.status !== 201) {
      return invalidResult();
    }

    try {
      return toJournalCreateResult(await response.json());
    } catch {
      return invalidResult();
    }
  }
}

function toJournalCreateResult(body: unknown): JournalCreateResult {
  if (typeof body !== 'object' || body === null || !('journalId' in body)) {
    return invalidResult();
  }

  const journalId = body.journalId;
  if (typeof journalId !== 'string' || journalId.trim().length === 0) {
    return invalidResult();
  }

  return { journalId };
}

function invalidResult(): JournalCreateResult {
  return { ...INVALID_RESULT };
}

function createFailedError(): Error {
  return new Error('create_failed');
}
