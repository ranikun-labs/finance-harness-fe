export type JournalEditFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
export class JournalEditError extends Error {
  constructor(readonly code: 'conflict' | 'failed') {
    super(code);
  }
}
export interface JournalRevisionRef {
  journalId: string;
  revision: number;
}
/** Capture this ref before review execution; never relabel a result after an edit. */
export function isCurrentJournalReviewResult(
  result: JournalRevisionRef,
  current: JournalRevisionRef,
): boolean {
  return (
    Number.isSafeInteger(result.revision) &&
    result.revision >= 0 &&
    result.journalId === current.journalId &&
    result.revision === current.revision
  );
}
export function createJournalEditPort(fetchImpl: JournalEditFetch) {
  return async (
    ref: JournalRevisionRef,
    fields: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<JournalRevisionRef> => {
    if (
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(ref.journalId) ||
      !Number.isSafeInteger(ref.revision) ||
      ref.revision < 0
    )
      throw new JournalEditError('failed');
    const response = await fetchImpl(`/finance/journals/${encodeURIComponent(ref.journalId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expectedRevision: ref.revision, fields }),
      signal,
      credentials: 'omit',
    });
    if (response.status === 409) throw new JournalEditError('conflict');
    if (!response.ok) throw new JournalEditError('failed');
    const data: unknown = await response.json();
    if (
      !data ||
      typeof data !== 'object' ||
      !('journalId' in data) ||
      !('revision' in data) ||
      data.journalId !== ref.journalId ||
      data.revision !== ref.revision + 1
    )
      throw new JournalEditError('failed');
    return { journalId: ref.journalId, revision: ref.revision + 1 };
  };
}
