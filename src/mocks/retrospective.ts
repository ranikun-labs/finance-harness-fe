import type { EmotionTag, RecordAction } from '@/constants/policy';
import type { DecisionContextSnapshot } from '@/mocks/decisionContext';
import type { JournalEntry } from '@/mocks/journalEntries';

/** Presentation-only draft. It is not a backend request or persistence model. */
export interface RetrospectiveDraft {
  body: string;
  outcomeObservation: string;
  decisionQuality: string;
  nextCheck: string;
}

export const EMPTY_RETROSPECTIVE_DRAFT: RetrospectiveDraft = {
  body: '',
  outcomeObservation: '',
  decisionQuality: '',
  nextCheck: '',
};

export interface RetrospectiveOriginalReference {
  id: string;
  recordedAt: string;
  question: string;
  memo: string;
  action?: RecordAction;
  emotion?: EmotionTag;
  decisionContext?: DecisionContextSnapshot;
}

/** A separate local/display record; the original Journal remains read-only. */
export interface RetrospectiveRecord {
  id: string;
  originalJournalId: string;
  createdAt: string;
  body: string;
  outcomeObservation: string;
  decisionQuality: string;
  nextCheck: string;
  original: RetrospectiveOriginalReference;
}

export interface RetrospectiveSavePort {
  save: (record: RetrospectiveRecord) => Promise<void>;
}

export const RETROSPECTIVE_CAPTURED_AT = '2026-08-11T09:00:00+09:00';

function cloneDecisionContext(
  context: DecisionContextSnapshot | undefined,
): DecisionContextSnapshot | undefined {
  if (!context) return undefined;

  return {
    ...context,
    checklist: context.checklist.map((item) => ({
      ...item,
      wording: { ...item.wording },
    })),
    optionalEvidence: context.optionalEvidence.map((item) => ({
      ...item,
      claim: { ...item.claim },
      source: { ...item.source },
    })),
  };
}

export function createRetrospectiveOriginalReference(
  entry: JournalEntry,
): RetrospectiveOriginalReference {
  return {
    id: entry.id,
    recordedAt: entry.recordedAt,
    question: entry.question,
    memo: entry.memo,
    ...(entry.type === 'investment' ? { action: entry.action, emotion: entry.emotion } : {}),
    decisionContext: cloneDecisionContext(entry.decisionContext),
  };
}

export function createRetrospectiveRecord(
  entry: JournalEntry,
  draft: RetrospectiveDraft,
  createdAt = RETROSPECTIVE_CAPTURED_AT,
): RetrospectiveRecord {
  return {
    id: `retrospective-${entry.id}-${createdAt}`,
    originalJournalId: entry.id,
    createdAt,
    body: draft.body.trim(),
    outcomeObservation: draft.outcomeObservation.trim(),
    decisionQuality: draft.decisionQuality.trim(),
    nextCheck: draft.nextCheck.trim(),
    original: createRetrospectiveOriginalReference(entry),
  };
}

export function createLocalRetrospectiveSavePort(options?: {
  failFirst?: boolean;
}): RetrospectiveSavePort {
  let attempts = 0;

  return {
    save: async () => {
      if (options?.failFirst && attempts++ === 0) {
        throw new Error('retrospective_fixture_save_failed');
      }
    },
  };
}
