import { describe, expect, it } from 'vitest';

import { DeterministicJournalCreatePort } from '@/test/journal/DeterministicJournalCreatePort';

const command = {
  type: 'study' as const,
  title: 'Study',
  occurredAt: '2026-08-03T09:30',
  keyContent: 'Content',
  openQuestions: ['Question'],
};

describe('DeterministicJournalCreatePort', () => {
  it('returns its fixed default result and snapshots each command', async () => {
    const port = new DeterministicJournalCreatePort();
    const result = await port.create(command);
    command.openQuestions[0] = 'Changed later';

    expect(result).toEqual({ journalId: 'test-journal-001' });
    expect(port.calls).toEqual([{ ...command, openQuestions: ['Question'] }]);
  });

  it('can deterministically fail', async () => {
    const port = new DeterministicJournalCreatePort({ failure: new Error('expected') });
    await expect(port.create(command)).rejects.toThrow('expected');
  });

  it('returns a configured immediate result and records every call', async () => {
    const port = new DeterministicJournalCreatePort({ result: { journalId: 'configured-id' } });

    await expect(port.create(command)).resolves.toEqual({ journalId: 'configured-id' });
    await expect(port.create(command)).resolves.toEqual({ journalId: 'configured-id' });
    expect(port.calls).toHaveLength(2);
  });

  it('keeps pending creates controlled until explicitly resolved', async () => {
    const port = new DeterministicJournalCreatePort({ pending: true });
    const promise = port.create(command);
    port.resolve({ journalId: 'known-id' });

    await expect(promise).resolves.toEqual({ journalId: 'known-id' });
  });

  it('can explicitly reject a pending create', async () => {
    const port = new DeterministicJournalCreatePort({ pending: true });
    const promise = port.create(command);
    port.reject(new Error('controlled failure'));

    await expect(promise).rejects.toThrow('controlled failure');
  });
});
