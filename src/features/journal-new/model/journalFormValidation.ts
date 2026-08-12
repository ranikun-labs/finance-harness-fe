import { EMOTION_TAGS, RECORD_ACTIONS } from '@/constants/policy';
import type {
  InvestmentJournalFormState,
  StudyJournalFormState,
} from '@/features/journal-new/model/journalFormTypes';

export type InvestmentJournalField =
  'assetName' | 'occurredAt' | 'action' | 'reasoning' | 'emotion';
export type StudyJournalField = 'title' | 'occurredAt' | 'keyContent' | 'openQuestions';
export type JournalFormField = InvestmentJournalField | StudyJournalField;
export type JournalValidationCode =
  'required' | 'max_length' | 'invalid_option' | 'invalid_datetime';
export type JournalValidationMessageKey =
  | 'journal.validation.required'
  | 'journal.validation.max_length'
  | 'journal.validation.invalid_option'
  | 'journal.validation.invalid_datetime';

export type JournalFieldError = {
  field: JournalFormField;
  code: JournalValidationCode;
  messageKey: JournalValidationMessageKey;
};

export type JournalValidationResult =
  { valid: true; errors: [] } | { valid: false; errors: JournalFieldError[] };

const MAX_ASSET_OR_TITLE_LENGTH = 120;
const MAX_REASONING_LENGTH = 4000;
const MAX_KEY_CONTENT_LENGTH = 6000;
export const MAX_OPEN_QUESTIONS = 10;
export const MAX_OPEN_QUESTION_LENGTH = 500;
const DATETIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?$/;

function error(
  field: JournalFormField,
  code: JournalValidationCode,
  messageKey: JournalValidationMessageKey,
): JournalFieldError {
  return { field, code, messageKey };
}

function addRequiredError(
  errors: JournalFieldError[],
  field: JournalFormField,
  value: string,
): boolean {
  if (value.trim() !== '') return false;
  errors.push(error(field, 'required', 'journal.validation.required'));
  return true;
}

function addMaximumLengthError(
  errors: JournalFieldError[],
  field: JournalFormField,
  value: string,
  maximum: number,
): void {
  if (value.length > maximum) {
    errors.push(error(field, 'max_length', 'journal.validation.max_length'));
  }
}

function isValidDateTime(value: string): boolean {
  const match = DATETIME_PATTERN.exec(value);
  if (!match) return false;

  const [, yearValue, monthValue, dayValue, hourValue, minuteValue, secondValue = '0'] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  const second = Number(secondValue);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return (
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth &&
    hour <= 23 &&
    minute <= 59 &&
    second <= 59
  );
}

function addOccurredAtError(errors: JournalFieldError[], occurredAt: string): void {
  if (addRequiredError(errors, 'occurredAt', occurredAt)) return;
  if (!isValidDateTime(occurredAt)) {
    errors.push(error('occurredAt', 'invalid_datetime', 'journal.validation.invalid_datetime'));
  }
}

function addOpenQuestionsErrors(errors: JournalFieldError[], questions: readonly string[]): void {
  if (
    questions.length > MAX_OPEN_QUESTIONS ||
    questions.some((question) => question.length > MAX_OPEN_QUESTION_LENGTH)
  ) {
    errors.push(error('openQuestions', 'max_length', 'journal.validation.max_length'));
  }
  if (questions.some((question) => question.trim() === '')) {
    errors.push(error('openQuestions', 'required', 'journal.validation.required'));
  }
}

function result(errors: JournalFieldError[]): JournalValidationResult {
  return errors.length === 0 ? { valid: true, errors: [] } : { valid: false, errors };
}

export function validateInvestmentJournalForm(
  state: InvestmentJournalFormState,
): JournalValidationResult {
  const errors: JournalFieldError[] = [];

  addRequiredError(errors, 'assetName', state.assetName);
  addMaximumLengthError(errors, 'assetName', state.assetName, MAX_ASSET_OR_TITLE_LENGTH);
  addOccurredAtError(errors, state.occurredAt);

  if (state.action === '') {
    errors.push(error('action', 'required', 'journal.validation.required'));
  } else if (!(RECORD_ACTIONS as readonly string[]).includes(state.action)) {
    errors.push(error('action', 'invalid_option', 'journal.validation.invalid_option'));
  }

  addRequiredError(errors, 'reasoning', state.reasoning);
  addMaximumLengthError(errors, 'reasoning', state.reasoning, MAX_REASONING_LENGTH);

  if (state.emotion !== '' && !(EMOTION_TAGS as readonly string[]).includes(state.emotion)) {
    errors.push(error('emotion', 'invalid_option', 'journal.validation.invalid_option'));
  }

  return result(errors);
}

export function validateStudyJournalForm(state: StudyJournalFormState): JournalValidationResult {
  const errors: JournalFieldError[] = [];

  addRequiredError(errors, 'title', state.title);
  addMaximumLengthError(errors, 'title', state.title, MAX_ASSET_OR_TITLE_LENGTH);
  addOccurredAtError(errors, state.occurredAt);
  addRequiredError(errors, 'keyContent', state.keyContent);
  addMaximumLengthError(errors, 'keyContent', state.keyContent, MAX_KEY_CONTENT_LENGTH);
  addOpenQuestionsErrors(errors, state.openQuestions);

  return result(errors);
}
