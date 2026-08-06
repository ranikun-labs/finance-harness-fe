import type { JournalCreateErrorCode } from '@/features/journal-new/model/journalCreatePort';

export type JournalSubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'failed'; error: JournalCreateErrorCode }
  | { status: 'succeeded'; journalId: string };

export type JournalSubmitEvent =
  | { type: 'submitStarted' }
  | { type: 'submitSucceeded'; journalId: string }
  | { type: 'submitFailed'; error: JournalCreateErrorCode }
  | { type: 'formEdited' };

export const initialJournalSubmitState: JournalSubmitState = { status: 'idle' };

export function journalSubmitReducer(
  state: JournalSubmitState,
  event: JournalSubmitEvent,
): JournalSubmitState {
  switch (event.type) {
    case 'submitStarted':
      return state.status === 'idle' || state.status === 'failed'
        ? { status: 'submitting' }
        : state;
    case 'submitSucceeded':
      return state.status === 'submitting'
        ? { status: 'succeeded', journalId: event.journalId }
        : state;
    case 'submitFailed':
      return state.status === 'submitting' ? { status: 'failed', error: event.error } : state;
    case 'formEdited':
      return state.status === 'failed' ? initialJournalSubmitState : state;
  }
}
