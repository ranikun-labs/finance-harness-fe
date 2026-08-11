import type { LocalizedText, ReviewResultFixture } from '@/mocks/reviewResult';
import { REVIEW_RESULT_FIXTURE } from '@/mocks/reviewResult';

/** Presentation-only version marker for the saved Review context fixture. */
export const DECISION_CONTEXT_VERSION = 'review-p0-v1';

export interface DecisionContextChecklistItem {
  id: string;
  wording: LocalizedText;
  checked: boolean;
}

export interface DecisionContextEvidence {
  id: string;
  claim: LocalizedText;
  source: LocalizedText;
  asOf: string;
  included: boolean;
}

/**
 * A display/view-model snapshot only. It is deliberately not a JournalCreate DTO
 * and is never sent to the existing create port.
 */
export interface DecisionContextSnapshot {
  originalQuestion: string;
  checklistVersion: string;
  checklist: DecisionContextChecklistItem[];
  capturedAt: string;
  optionalEvidence: DecisionContextEvidence[];
}

export function createDecisionContextSnapshot(
  question: string,
  fixture: ReviewResultFixture,
  checkedItems: Record<string, boolean>,
  includedEvidenceIds?: readonly string[],
): DecisionContextSnapshot {
  const includedIds = new Set(includedEvidenceIds ?? fixture.facts.map((fact) => fact.id));

  return {
    originalQuestion: question,
    checklistVersion: DECISION_CONTEXT_VERSION,
    checklist: fixture.checklist.map((item) => ({
      id: item.id,
      wording: { ...item.title },
      checked: Boolean(checkedItems[item.id]),
    })),
    capturedAt: fixture.reviewedAt,
    optionalEvidence: fixture.facts.map((fact) => ({
      id: fact.id,
      claim: { ...fact.claim },
      source: { ...fact.source },
      asOf: fact.asOf,
      included: includedIds.has(fact.id),
    })),
  };
}

export const SAMPLE_DECISION_CONTEXT = createDecisionContextSnapshot(
  '반도체 기업 A 요즘 어때?',
  REVIEW_RESULT_FIXTURE,
  {
    'business-context': true,
    'industry-flow': true,
    'earnings-assumptions': false,
    'counter-evidence': false,
  },
  ['quarterly-revenue'],
);
