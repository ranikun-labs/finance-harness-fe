import type { JournalCreateCommand } from '@/features/journal-new/model/journalCreateCommand';
import {
  JournalCreatePortError,
  type JournalCreatePort,
  type JournalCreateResult,
} from '@/features/journal-new/model/journalCreatePort';
import { toCreateJournalRequest } from '@/features/journal-new/adapter/journalCreateRequest';

export type JournalFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type HttpJournalCreatePortOptions = {
  fetchImpl: JournalFetch;
  timeZone: string;
};

const INVALID_RESULT: JournalCreateResult = { journalId: '' };
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._~-]{0,127}$/;

export class HttpJournalCreatePort implements JournalCreatePort {
  private readonly fetchImpl: JournalFetch;

  private readonly timeZone: string;

  constructor({ fetchImpl, timeZone }: HttpJournalCreatePortOptions) {
    this.fetchImpl = fetchImpl;
    this.timeZone = timeZone;
  }

  async create(
    command: JournalCreateCommand,
    idempotencyKey: string,
  ): Promise<JournalCreateResult> {
    const idempotencyKeyMatch =
      typeof idempotencyKey === 'string' && IDEMPOTENCY_KEY_PATTERN.exec(idempotencyKey);
    if (!idempotencyKeyMatch || idempotencyKeyMatch[0] !== idempotencyKey) {
      throw new JournalCreatePortError('invalid_request');
    }

    const request = toCreateJournalRequest(command, this.timeZone);
    let response: Response;

    try {
      response = await this.fetchImpl('/finance/journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(request),
      });
    } catch {
      throw new JournalCreatePortError('network_error');
    }

    if (response.status < 200 || response.status >= 300) {
      if (response.status === 400) {
        throw new JournalCreatePortError('invalid_request');
      }
      if (response.status === 409) {
        throw new JournalCreatePortError('idempotency_conflict');
      }
      throw new JournalCreatePortError('create_failed');
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
