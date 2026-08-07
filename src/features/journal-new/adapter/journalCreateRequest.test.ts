import { describe, expect, it } from 'vitest';

import type {
  InvestmentJournalCreateCommand,
  StudyJournalCreateCommand,
} from '@/features/journal-new/model/journalCreateCommand';
import { toCreateJournalRequest } from '@/features/journal-new/adapter/journalCreateRequest';

describe('toCreateJournalRequest', () => {
  it('maps an investment command to the exact backend DTO and preserves canonical values', () => {
    const command: InvestmentJournalCreateCommand = {
      type: 'investment',
      assetName: 'Asset  A',
      occurredAt: '2026-08-07T14:30',
      action: 'buy',
      reasoning: 'Reason  text',
      emotion: '확신',
    };
    const before = structuredClone(command);

    const request = toCreateJournalRequest(command, 'Asia/Seoul');

    expect(request).toEqual({
      type: 'investment',
      assetName: 'Asset  A',
      occurredAt: '2026-08-07T14:30',
      timeZone: 'Asia/Seoul',
      action: 'buy',
      reasoning: 'Reason  text',
      emotion: '확신',
    });
    expect(command).toEqual(before);
  });

  it('omits investment emotion when the command has no emotion', () => {
    const command: InvestmentJournalCreateCommand = {
      type: 'investment',
      assetName: 'Asset A',
      occurredAt: '2026-08-07T14:30',
      action: 'interest',
      reasoning: 'Reason',
    };

    const request = toCreateJournalRequest(command, 'America/Los_Angeles');

    expect(request).toEqual({
      type: 'investment',
      assetName: 'Asset A',
      occurredAt: '2026-08-07T14:30',
      timeZone: 'America/Los_Angeles',
      action: 'interest',
      reasoning: 'Reason',
    });
    expect(request).not.toHaveProperty('emotion');
  });

  it('maps a study command with the supplied timezone and preserves question order', () => {
    const command: StudyJournalCreateCommand = {
      type: 'study',
      title: 'Title',
      occurredAt: '2026-08-07T14:30',
      keyContent: 'Key  content',
      openQuestions: ['First', 'Second', 'First'],
    };
    const before = structuredClone(command);

    const request = toCreateJournalRequest(command, 'Asia/Seoul');

    expect(request).toEqual({
      type: 'study',
      title: 'Title',
      occurredAt: '2026-08-07T14:30',
      timeZone: 'Asia/Seoul',
      keyContent: 'Key  content',
      openQuestions: ['First', 'Second', 'First'],
    });
    expect(command).toEqual(before);
    expect(request.openQuestions).toEqual(['First', 'Second', 'First']);
  });
});
