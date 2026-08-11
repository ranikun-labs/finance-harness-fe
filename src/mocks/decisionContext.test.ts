import { describe, expect, it } from 'vitest';

import {
  createDecisionContextSnapshot,
  type DecisionContextSnapshot,
} from '@/mocks/decisionContext';
import { getReviewFixture, type ReviewResultFixture } from '@/mocks/reviewResult';

function createIsolatedReviewFixture(): ReviewResultFixture {
  const fixture = getReviewFixture();
  return {
    ...fixture,
    checklist: fixture.checklist.map((item) => ({
      ...item,
      title: { ...item.title },
    })),
    facts: fixture.facts.map((fact) => ({
      ...fact,
      claim: { ...fact.claim },
      source: { ...fact.source },
    })),
    inferences: fixture.inferences.map((inference) => ({
      ...inference,
      text: { ...inference.text },
      basis: { ...inference.basis },
    })),
    unknowns: fixture.unknowns.map((unknown) => ({
      ...unknown,
      tag: { ...unknown.tag },
      text: { ...unknown.text },
    })),
  };
}

function createSnapshot(fixture: ReviewResultFixture): DecisionContextSnapshot {
  return createDecisionContextSnapshot(
    '반도체 기업 A 요즘 어때?',
    fixture,
    { 'business-context': true },
    ['quarterly-revenue'],
  );
}

describe('Decision Context snapshot ownership', () => {
  it('keeps minimum context and evidence stable when the source Review fixture changes', () => {
    const fixture = createIsolatedReviewFixture();
    const snapshot = createSnapshot(fixture);
    const originalChecklistWording = snapshot.checklist[0].wording.ko;
    const originalClaim = snapshot.optionalEvidence[0].claim.ko;
    const originalSource = snapshot.optionalEvidence[0].source.ko;

    fixture.checklist[0].title.ko = '변경된 확인 항목';
    fixture.facts[0].claim.ko = '변경된 근거';
    fixture.facts[0].source.ko = '변경된 출처';

    expect(snapshot.checklist[0].wording.ko).toBe(originalChecklistWording);
    expect(snapshot.optionalEvidence[0].claim.ko).toBe(originalClaim);
    expect(snapshot.optionalEvidence[0].source.ko).toBe(originalSource);
    expect(snapshot.checklist[0].wording).not.toBe(fixture.checklist[0].title);
    expect(snapshot.optionalEvidence[0].claim).not.toBe(fixture.facts[0].claim);
    expect(snapshot.optionalEvidence[0].source).not.toBe(fixture.facts[0].source);
  });
});
