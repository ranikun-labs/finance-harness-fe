import type { JournalEditFetch, JournalRevisionRef } from '@/features/journal-edit/journalEditPort';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export class JournalLifecycleError extends Error {
  constructor(readonly code: 'conflict' | 'failed') {
    super(code);
  }
}
export interface DeletedJournal extends JournalRevisionRef {
  type: 'study' | 'investment';
  deletedAt: string;
}
const validRef = (r: JournalRevisionRef) =>
  uuid.test(r.journalId) && Number.isSafeInteger(r.revision) && r.revision >= 0;
export function createJournalLifecyclePort(fetchImpl: JournalEditFetch) {
  return {
    async transition(ref: JournalRevisionRef, action: 'delete' | 'restore', signal?: AbortSignal) {
      if (!validRef(ref) || ref.revision >= Number.MAX_SAFE_INTEGER)
        throw new JournalLifecycleError('failed');
      const response = await fetchImpl(`/finance/journals/${ref.journalId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedRevision: ref.revision }),
        credentials: 'omit',
        signal,
      });
      if (response.status === 409) throw new JournalLifecycleError('conflict');
      if (!response.ok) throw new JournalLifecycleError('failed');
      const result = (await response.json()) as {
        journalId?: unknown;
        revision?: unknown;
        state?: unknown;
      };
      if (
        result.journalId !== ref.journalId ||
        result.revision !== ref.revision + 1 ||
        result.state !== (action === 'delete' ? 'deleted' : 'active')
      )
        throw new JournalLifecycleError('failed');
      return { journalId: ref.journalId, revision: ref.revision + 1, state: result.state };
    },
    async list(signal?: AbortSignal): Promise<{ items: DeletedJournal[]; hasMore: boolean }> {
      const response = await fetchImpl('/finance/journals/deleted', {
        credentials: 'omit',
        signal,
      });
      if (!response.ok) throw new JournalLifecycleError('failed');
      const result: unknown = await response.json();
      if (
        !result ||
        typeof result !== 'object' ||
        !('items' in result) ||
        !Array.isArray(result.items) ||
        !('hasMore' in result) ||
        typeof result.hasMore !== 'boolean' ||
        result.items.length > 100
      )
        throw new JournalLifecycleError('failed');
      const items = result.items.map((item: unknown) => {
        if (!item || typeof item !== 'object') throw new JournalLifecycleError('failed');
        const r = item as DeletedJournal;
        if (
          !validRef(r) ||
          !['study', 'investment'].includes(r.type) ||
          typeof r.deletedAt !== 'string' ||
          !Number.isFinite(Date.parse(r.deletedAt))
        )
          throw new JournalLifecycleError('failed');
        // Deliberately retain only tombstone metadata, even if a server adds other fields.
        return {
          journalId: r.journalId,
          revision: r.revision,
          type: r.type,
          deletedAt: r.deletedAt,
        };
      });
      return { items, hasMore: result.hasMore };
    },
  };
}
