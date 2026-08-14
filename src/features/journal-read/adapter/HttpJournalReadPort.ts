import {
  parseJournalDetailResponse,
  parseJournalListResponse,
  type JournalDetailResponse,
  type JournalListResponse,
} from '@/features/journal-read/adapter/journalReadResponse';
import type {
  JournalListRequest,
  JournalReadError,
  JournalReadPort,
  JournalReadResult,
} from '@/features/journal-read/model/journalReadPort';

export type JournalReadFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface HttpJournalReadPortOptions {
  fetchImpl: JournalReadFetch;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export class HttpJournalReadPort implements JournalReadPort {
  private readonly fetchImpl: JournalReadFetch;

  constructor({ fetchImpl }: HttpJournalReadPortOptions) {
    this.fetchImpl = fetchImpl;
  }

  async list(request: JournalListRequest = {}): Promise<JournalReadResult<JournalListResponse>> {
    const validation = validateListRequest(request);
    if (validation.ok === false) return validation;

    const params = new URLSearchParams();
    params.set('limit', String(validation.limit));
    if (request.cursor !== undefined) params.set('cursor', request.cursor);

    const result = await this.get(`/finance/journals?${params.toString()}`, request.signal);
    if (result.ok === false) return result;

    try {
      return { ok: true, data: parseJournalListResponse(result.data) };
    } catch {
      return invalidResult(200);
    }
  }

  async detail(
    journalId: string,
    signal?: AbortSignal,
  ): Promise<JournalReadResult<JournalDetailResponse>> {
    if (typeof journalId !== 'string' || journalId.trim() === '') {
      return invalidRequest();
    }

    const result = await this.get(
      `/finance/journals/${encodeURIComponent(journalId)}`,
      signal,
      true,
    );
    if (result.ok === false) return result;

    try {
      return { ok: true, data: parseJournalDetailResponse(result.data) };
    } catch {
      return invalidResult(200);
    }
  }

  /** Explicit aliases keep adapter use readable at call sites and in integration tests. */
  getList(request: JournalListRequest = {}) {
    return this.list(request);
  }

  getDetail(journalId: string, signal?: AbortSignal) {
    return this.detail(journalId, signal);
  }

  private async get(
    path: string,
    signal?: AbortSignal,
    detailRequest = false,
  ): Promise<JournalReadResult<unknown>> {
    const init: RequestInit = {
      method: 'GET',
      headers: { Accept: 'application/json' },
    };
    if (signal !== undefined) init.signal = signal;

    let response: Response;
    try {
      response = await this.fetchImpl(path, init);
    } catch {
      return readFailed();
    }

    if (response.status !== 200) {
      return errorForStatus(response.status, detailRequest);
    }

    try {
      return { ok: true, data: await response.json() };
    } catch {
      return invalidResult(200);
    }
  }
}

function validateListRequest(
  request: JournalListRequest,
): { ok: true; limit: number } | { ok: false; error: JournalReadError } {
  const limit = request.limit ?? DEFAULT_LIMIT;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) return invalidRequest();
  if (
    request.cursor !== undefined &&
    (typeof request.cursor !== 'string' || request.cursor === '')
  ) {
    return invalidRequest();
  }
  return { ok: true, limit };
}

function invalidRequest(): { ok: false; error: JournalReadError } {
  return { ok: false, error: { code: 'invalid_request', status: 400 } };
}

function invalidResult(status?: number): { ok: false; error: JournalReadError } {
  return { ok: false, error: { code: 'invalid_result', status } };
}

function readFailed(status?: number): { ok: false; error: JournalReadError } {
  return { ok: false, error: { code: 'read_failed', status } };
}

function errorForStatus(
  status: number,
  detailRequest: boolean,
): { ok: false; error: JournalReadError } {
  if (status === 400) return invalidRequest();
  if (detailRequest && status === 404) {
    return { ok: false, error: { code: 'journal_not_found', status: 404 } };
  }
  return readFailed(status);
}
