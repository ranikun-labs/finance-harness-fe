import { describe, expect, it } from 'vitest';

import {
  toInvestmentJournalCreateCommand,
  toStudyJournalCreateCommand,
} from '@/features/journal-new/model/journalCreateCommand';
import type { InvestmentJournalFormState } from '@/features/journal-new/model/journalFormTypes';

describe('journal create command mapping', () => {
  it('maps an investment form state without UI metadata and normalizes text', () => {
    const state: InvestmentJournalFormState = {
      type: 'investment',
      assetName: '  기업 A  ',
      occurredAt: '2026-08-03T09:30',
      action: 'interest' as const,
      reasoning: '  판단 근거  ',
      emotion: '',
    };
    const before = structuredClone(state);

    const command = toInvestmentJournalCreateCommand(state);

    expect(command).toEqual({
      type: 'investment',
      assetName: '기업 A',
      occurredAt: '2026-08-03T09:30',
      action: 'interest',
      reasoning: '판단 근거',
      emotion: undefined,
    });
    expect(state).toEqual(before);
  });

  it('preserves a valid investment emotion', () => {
    expect(
      toInvestmentJournalCreateCommand({
        type: 'investment',
        assetName: '기업 A',
        occurredAt: '2026-08-03T09:30',
        action: 'buy',
        reasoning: '근거',
        emotion: '확신',
      }),
    ).toMatchObject({ emotion: '확신' });
  });

  it('maps study questions without mutating their input and preserves duplicate order', () => {
    const openQuestions = [' 질문 하나 ', ' ', '질문 둘', '질문 하나'];
    const state = {
      type: 'study' as const,
      title: '  공부 제목  ',
      occurredAt: '2026-08-03T09:30',
      keyContent: '  핵심 내용  ',
      openQuestions,
    };
    const before = structuredClone(state);

    const command = toStudyJournalCreateCommand(state);

    expect(command).toEqual({
      type: 'study',
      title: '공부 제목',
      occurredAt: '2026-08-03T09:30',
      keyContent: '핵심 내용',
      openQuestions: ['질문 하나', '질문 둘', '질문 하나'],
    });
    expect(state).toEqual(before);
    expect(state.openQuestions).toEqual(before.openQuestions);
  });
});
