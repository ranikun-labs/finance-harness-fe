import { describe, expect, it } from 'vitest';

import {
  createReviewJournalHandoff,
  getReviewFixture,
  REVIEW_RESULT_FIXTURE,
} from '@/mocks/reviewResult';

describe('Review Journal handoff view-model', () => {
  it('keeps Decision Record user-owned fields empty', () => {
    const handoff = createReviewJournalHandoff(
      'investment',
      '무엇을 확인할까?',
      REVIEW_RESULT_FIXTURE,
      'ko',
      '/app/ask?q=무엇을+확인할까?',
    );

    expect(handoff).toEqual({
      kind: 'investment',
      originalQuestion: '무엇을 확인할까?',
      returnTarget: '/app/ask?q=무엇을+확인할까?',
    });
  });

  it('maps only visible Learning Note content and preserves fixture order', () => {
    const fixture = getReviewFixture();
    const handoff = createReviewJournalHandoff('study', '질문', fixture, 'ko', '/app/ask?q=질문');

    expect(handoff.learningDraft).toEqual({
      title: '질문',
      keyContent: fixture.inferences.map((item) => item.text.ko).join('\n\n'),
      openQuestions: fixture.unknowns.map((item) => item.text.ko),
    });
    expect(handoff.learningDraft?.openQuestions).toHaveLength(fixture.unknowns.length);
  });
});
