import { describe, expect, it } from 'vitest';

import { SAMPLE_DECISION_CONTEXT } from '@/mocks/decisionContext';
import {
  createRetrospectiveOriginalReference,
  createRetrospectiveRecord,
  type RetrospectiveDraft,
} from '@/mocks/retrospective';
import { JOURNAL_ENTRIES, type JournalEntry } from '@/mocks/journalEntries';

const draft: RetrospectiveDraft = {
  body: '다시 보니 확인할 항목을 먼저 좁혔어야 했다.',
  outcomeObservation: '이후 실적 발표는 예상에 부합했다.',
  decisionQuality: '근거와 감정을 분리해 적은 점은 유지한다.',
  nextCheck: '다음에는 반대 근거를 먼저 확인한다.',
};

describe('Retrospective view-model isolation', () => {
  it('copies the Original Journal reference and keeps the separate record independent', () => {
    const original = JOURNAL_ENTRIES[0];
    const record = createRetrospectiveRecord(original, draft);
    const before = {
      action: original.type === 'investment' ? original.action : undefined,
      emotion: original.emotion,
      memo: original.memo,
      recordedAt: original.recordedAt,
      decisionContext: original.decisionContext,
    };

    expect(record.originalJournalId).toBe(original.id);
    expect(record.original).not.toBe(original);
    expect(record.original.decisionContext).not.toBe(original.decisionContext);
    expect(record.original.decisionContext).toEqual(SAMPLE_DECISION_CONTEXT);

    record.body = '별도 복기 레코드만 변경';
    record.original.memo = '복기 쪽에서 바꾼 값';
    if (record.original.decisionContext) {
      record.original.decisionContext.checklist[0].wording.ko = '복기에서 바꾼 항목';
    }

    expect(original).toMatchObject({
      memo: before.memo,
      recordedAt: before.recordedAt,
      emotion: before.emotion,
      action: before.action,
    });
    expect(original.decisionContext).toEqual(before.decisionContext);
  });

  it('does not mutate the Original Journal while creating a reference', () => {
    const original = JOURNAL_ENTRIES[0];
    const before = JSON.stringify(original);
    const reference = createRetrospectiveOriginalReference(original);

    reference.question = '복기 reference에서만 변경';
    if (reference.decisionContext) {
      reference.decisionContext.optionalEvidence[0].claim.ko = '복기 reference 근거';
    }

    expect(JSON.stringify(original)).toBe(before);
  });

  it('preserves the source entry shape for study Journals without investment-only fields', () => {
    const study = JOURNAL_ENTRIES.find((entry) => entry.type === 'study') as JournalEntry;
    const reference = createRetrospectiveOriginalReference(study);

    expect(reference.action).toBeUndefined();
    expect(reference.emotion).toBeUndefined();
    expect(reference.id).toBe(study.id);
  });
});
