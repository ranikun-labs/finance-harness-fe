import {
  EMOTION_TAGS,
  RECORD_ACTIONS,
  type EmotionTag,
  type RecordAction,
} from '@/constants/policy';
import type { JournalEntryType } from '@/constants/routes';

export interface InvestmentJournalDetailResponse {
  journalId: string;
  type: 'investment';
  occurredAt: string;
  timeZone: string;
  createdAt: string;
  updatedAt: string;
  assetName: string;
  action: RecordAction;
  reasoning: string;
  emotion: EmotionTag | null;
}

export interface StudyJournalDetailResponse {
  journalId: string;
  type: 'study';
  occurredAt: string;
  timeZone: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  keyContent: string;
  openQuestions: string[];
}

export type JournalDetailResponse = InvestmentJournalDetailResponse | StudyJournalDetailResponse;

export interface InvestmentJournalSummaryResponse {
  journalId: string;
  type: 'investment';
  occurredAt: string;
  timeZone: string;
  assetName: string;
  action: RecordAction;
}

export interface StudyJournalSummaryResponse {
  journalId: string;
  type: 'study';
  occurredAt: string;
  timeZone: string;
  title: string;
}

export type JournalListItemResponse =
  InvestmentJournalSummaryResponse | StudyJournalSummaryResponse;

export interface JournalListResponse {
  items: JournalListItemResponse[];
  nextCursor: string | null;
}

export class JournalResponseValidationError extends Error {
  constructor() {
    super('invalid_result');
    this.name = 'JournalResponseValidationError';
  }
}

const LOCAL_DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/;
const UTC_INSTANT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/;

const JOURNAL_TYPES: readonly JournalEntryType[] = ['investment', 'study'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isEnumValue<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && values.includes(value as T);
}

function isValidCivilDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) return false;
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1]!;
}

function isValidTime(hour: number, minute: number, second: number): boolean {
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 && second >= 0 && second <= 59;
}

/** Strict backend LocalDateTime wire shape; it is deliberately not parsed as a Date. */
export function isJournalOccurredAt(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = LOCAL_DATE_TIME_PATTERN.exec(value);
  if (!match) return false;
  const [, year, month, day, hour, minute, second] = match;
  return (
    isValidCivilDate(Number(year), Number(month), Number(day)) &&
    isValidTime(Number(hour), Number(minute), Number(second))
  );
}

/** Strict UTC Instant wire shape used by createdAt/updatedAt. */
export function isJournalUtcInstant(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = UTC_INSTANT_PATTERN.exec(value);
  if (!match) return false;
  const [, year, month, day, hour, minute, second] = match;
  return (
    isValidCivilDate(Number(year), Number(month), Number(day)) &&
    isValidTime(Number(hour), Number(minute), Number(second))
  );
}

function isIanaTimeZone(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function parseCommonDetail(value: Record<string, unknown>): {
  journalId: string;
  occurredAt: string;
  timeZone: string;
  createdAt: string;
  updatedAt: string;
} {
  if (
    !isNonEmptyString(value.journalId) ||
    !isJournalOccurredAt(value.occurredAt) ||
    !isIanaTimeZone(value.timeZone) ||
    !isJournalUtcInstant(value.createdAt) ||
    !isJournalUtcInstant(value.updatedAt)
  ) {
    throw new JournalResponseValidationError();
  }

  return {
    journalId: value.journalId,
    occurredAt: value.occurredAt,
    timeZone: value.timeZone,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function parseCommonSummary(value: Record<string, unknown>): {
  journalId: string;
  occurredAt: string;
  timeZone: string;
} {
  if (
    !isNonEmptyString(value.journalId) ||
    !isJournalOccurredAt(value.occurredAt) ||
    !isIanaTimeZone(value.timeZone)
  ) {
    throw new JournalResponseValidationError();
  }

  return {
    journalId: value.journalId,
    occurredAt: value.occurredAt,
    timeZone: value.timeZone,
  };
}

export function parseJournalDetailResponse(value: unknown): JournalDetailResponse {
  if (!isRecord(value) || !isEnumValue(JOURNAL_TYPES, value.type)) {
    throw new JournalResponseValidationError();
  }

  const common = parseCommonDetail(value);
  if (value.type === 'investment') {
    if (
      !isNonEmptyString(value.assetName) ||
      !isEnumValue(RECORD_ACTIONS, value.action) ||
      typeof value.reasoning !== 'string' ||
      !hasOwn(value, 'emotion') ||
      (value.emotion !== null && !isEnumValue(EMOTION_TAGS, value.emotion))
    ) {
      throw new JournalResponseValidationError();
    }

    return {
      ...common,
      type: 'investment',
      assetName: value.assetName,
      action: value.action,
      reasoning: value.reasoning,
      emotion: value.emotion,
    };
  }

  if (
    !isNonEmptyString(value.title) ||
    typeof value.keyContent !== 'string' ||
    !isStringArray(value.openQuestions)
  ) {
    throw new JournalResponseValidationError();
  }

  return {
    ...common,
    type: 'study',
    title: value.title,
    keyContent: value.keyContent,
    // Clone without sorting or filtering so backend order and duplicates survive.
    openQuestions: [...value.openQuestions],
  };
}

export function parseJournalListItemResponse(value: unknown): JournalListItemResponse {
  if (!isRecord(value) || !isEnumValue(JOURNAL_TYPES, value.type)) {
    throw new JournalResponseValidationError();
  }

  const common = parseCommonSummary(value);
  if (value.type === 'investment') {
    if (!isNonEmptyString(value.assetName) || !isEnumValue(RECORD_ACTIONS, value.action)) {
      throw new JournalResponseValidationError();
    }
    return {
      ...common,
      type: 'investment',
      assetName: value.assetName,
      action: value.action,
    };
  }

  if (!isNonEmptyString(value.title)) {
    throw new JournalResponseValidationError();
  }
  return { ...common, type: 'study', title: value.title };
}

export function parseJournalListResponse(value: unknown): JournalListResponse {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new JournalResponseValidationError();
  }
  if (value.nextCursor !== null && !isNonEmptyString(value.nextCursor)) {
    throw new JournalResponseValidationError();
  }

  return {
    items: value.items.map((item) => parseJournalListItemResponse(item)),
    nextCursor: value.nextCursor,
  };
}

export function isJournalDetailResponse(value: unknown): value is JournalDetailResponse {
  try {
    parseJournalDetailResponse(value);
    return true;
  } catch {
    return false;
  }
}

export function isJournalListResponse(value: unknown): value is JournalListResponse {
  try {
    parseJournalListResponse(value);
    return true;
  } catch {
    return false;
  }
}
