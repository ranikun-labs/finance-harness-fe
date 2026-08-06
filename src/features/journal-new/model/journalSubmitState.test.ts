import { describe, expect, it } from 'vitest';

import {
  initialJournalSubmitState,
  journalSubmitReducer,
} from '@/features/journal-new/model/journalSubmitState';

describe('journal submit state', () => {
  it('moves through submit, failure, edit, and success without mutating prior state', () => {
    const submitting = journalSubmitReducer(initialJournalSubmitState, { type: 'submitStarted' });
    const failed = journalSubmitReducer(submitting, {
      type: 'submitFailed',
      error: 'create_failed',
    });
    const idle = journalSubmitReducer(failed, { type: 'formEdited' });
    const retrying = journalSubmitReducer(idle, { type: 'submitStarted' });
    const succeeded = journalSubmitReducer(retrying, {
      type: 'submitSucceeded',
      journalId: 'created-id',
    });

    expect(initialJournalSubmitState).toEqual({ status: 'idle' });
    expect(submitting).toEqual({ status: 'submitting' });
    expect(failed).toEqual({ status: 'failed', error: 'create_failed' });
    expect(idle).toEqual({ status: 'idle' });
    expect(succeeded).toEqual({ status: 'succeeded', journalId: 'created-id' });
  });

  it('does not corrupt state for events that are disallowed in the current state', () => {
    expect(
      journalSubmitReducer(initialJournalSubmitState, { type: 'submitSucceeded', journalId: 'x' }),
    ).toBe(initialJournalSubmitState);
    const submitting = journalSubmitReducer(initialJournalSubmitState, { type: 'submitStarted' });
    expect(journalSubmitReducer(submitting, { type: 'formEdited' })).toBe(submitting);
    expect(journalSubmitReducer(submitting, { type: 'submitStarted' })).toBe(submitting);
    expect(
      journalSubmitReducer(
        journalSubmitReducer(submitting, { type: 'submitSucceeded', journalId: 'id' }),
        { type: 'submitFailed', error: 'create_failed' },
      ),
    ).toEqual({ status: 'succeeded', journalId: 'id' });
  });

  it('retains invalid-result failure as a generic application error code', () => {
    const submitting = journalSubmitReducer(initialJournalSubmitState, { type: 'submitStarted' });
    expect(
      journalSubmitReducer(submitting, { type: 'submitFailed', error: 'invalid_result' }),
    ).toEqual({
      status: 'failed',
      error: 'invalid_result',
    });
  });
});
