import { describe, expect, it } from 'vitest';

import type { StudyJournalCreateCommand } from '@/features/journal-new/model/journalCreateCommand';
import { DeterministicJournalCreatePort } from '@/test/journal/DeterministicJournalCreatePort';

function createStudyCommand(): StudyJournalCreateCommand {
  return {
    type: 'study',
    title: 'Study',
    occurredAt: '2026-08-03T09:30',
    keyContent: 'Content',
    openQuestions: ['Question'],
  };
}

describe('DeterministicJournalCreatePort', () => {
  it('returns its fixed default result and snapshots each command', async () => {
    const port = new DeterministicJournalCreatePort();
    const command = createStudyCommand();
    const result = await port.create(command);
    command.openQuestions[0] = 'Changed later';

    expect(result).toEqual({ journalId: 'test-journal-001' });
    expect(port.calls).toEqual([createStudyCommand()]);
    const recordedCommand = port.calls[0];
    if (!recordedCommand || recordedCommand.type !== 'study') {
      throw new Error('expected the recorded command to remain a study command');
    }
    expect(recordedCommand.openQuestions).toEqual(['Question']);
  });

  it('can deterministically fail', async () => {
    const port = new DeterministicJournalCreatePort({ failure: new Error('expected') });
    await expect(port.create(createStudyCommand())).rejects.toThrow('expected');
  });

  it('returns a configured immediate result and records every call', async () => {
    const port = new DeterministicJournalCreatePort({ result: { journalId: 'configured-id' } });

    await expect(port.create(createStudyCommand())).resolves.toEqual({
      journalId: 'configured-id',
    });
    await expect(port.create(createStudyCommand())).resolves.toEqual({
      journalId: 'configured-id',
    });
    expect(port.calls).toHaveLength(2);
  });

  it('keeps pending creates controlled until explicitly resolved', async () => {
    const port = new DeterministicJournalCreatePort({ pending: true });
    const promise = port.create(createStudyCommand());
    port.resolve({ journalId: 'known-id' });

    await expect(promise).resolves.toEqual({ journalId: 'known-id' });
  });

  it('can explicitly reject a pending create', async () => {
    const port = new DeterministicJournalCreatePort({ pending: true });
    const promise = port.create(createStudyCommand());
    port.reject(new Error('controlled failure'));

    await expect(promise).rejects.toThrow('controlled failure');
  });
});
