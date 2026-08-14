export type JournalReadErrorCode =
  'invalid_request' | 'journal_not_found' | 'read_failed' | 'invalid_result';

/** FE-owned error; backend response details never cross the transport boundary. */
export interface JournalReadError {
  code: JournalReadErrorCode;
  status?: number;
}

export type JournalReadResult<T> = { ok: true; data: T } | { ok: false; error: JournalReadError };

export interface JournalListRequest {
  limit?: number;
  /** Opaque continuation token. The read flow must not inspect or transform it. */
  cursor?: string;
  signal?: AbortSignal;
}

export interface JournalReadPort<
  JournalListResponse =
    import('@/features/journal-read/adapter/journalReadResponse').JournalListResponse,
  JournalDetailResponse =
    import('@/features/journal-read/adapter/journalReadResponse').JournalDetailResponse,
> {
  list(request?: JournalListRequest): Promise<JournalReadResult<JournalListResponse>>;
  detail(
    journalId: string,
    signal?: AbortSignal,
  ): Promise<JournalReadResult<JournalDetailResponse>>;
}
