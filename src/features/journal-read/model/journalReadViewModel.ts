import type {
  InvestmentJournalDetailResponse,
  InvestmentJournalSummaryResponse,
  JournalDetailResponse,
  JournalListItemResponse,
  StudyJournalDetailResponse,
  StudyJournalSummaryResponse,
} from '@/features/journal-read/adapter/journalReadResponse';

/** Local wall-clock value. It is intentionally not a JavaScript Date/Instant. */
export type JournalOccurredAt = string & { readonly __journalOccurredAt: 'local-wall-clock' };

/** UTC value used only for server audit timestamps. */
export type JournalUtcInstant = string & { readonly __journalUtcInstant: 'utc-instant' };

interface JournalTimeViewModel {
  occurredAt: JournalOccurredAt;
  timeZone: string;
}

interface JournalAuditTimestampsViewModel {
  createdAt: JournalUtcInstant;
  updatedAt: JournalUtcInstant;
}

export type InvestmentJournalSummaryViewModel = JournalTimeViewModel &
  Pick<InvestmentJournalSummaryResponse, 'journalId' | 'type' | 'assetName' | 'action'>;

export type StudyJournalSummaryViewModel = JournalTimeViewModel &
  Pick<StudyJournalSummaryResponse, 'journalId' | 'type' | 'title'>;

export type JournalListItemViewModel =
  InvestmentJournalSummaryViewModel | StudyJournalSummaryViewModel;

export type InvestmentJournalDetailViewModel = JournalTimeViewModel &
  JournalAuditTimestampsViewModel &
  Pick<
    InvestmentJournalDetailResponse,
    'journalId' | 'type' | 'assetName' | 'action' | 'reasoning' | 'emotion'
  >;

export type StudyJournalDetailViewModel = JournalTimeViewModel &
  JournalAuditTimestampsViewModel &
  Pick<StudyJournalDetailResponse, 'journalId' | 'type' | 'title' | 'keyContent' | 'openQuestions'>;

export type JournalDetailViewModel = InvestmentJournalDetailViewModel | StudyJournalDetailViewModel;

function toOccurredAt(value: string): JournalOccurredAt {
  return value as JournalOccurredAt;
}

function toUtcInstant(value: string): JournalUtcInstant {
  return value as JournalUtcInstant;
}

export function toJournalListItemViewModel(
  response: JournalListItemResponse,
): JournalListItemViewModel {
  if (response.type === 'investment') {
    return {
      journalId: response.journalId,
      type: 'investment',
      occurredAt: toOccurredAt(response.occurredAt),
      timeZone: response.timeZone,
      assetName: response.assetName,
      action: response.action,
    };
  }

  return {
    journalId: response.journalId,
    type: 'study',
    occurredAt: toOccurredAt(response.occurredAt),
    timeZone: response.timeZone,
    title: response.title,
  };
}

export function toJournalDetailViewModel(response: JournalDetailResponse): JournalDetailViewModel {
  if (response.type === 'investment') {
    return {
      journalId: response.journalId,
      type: 'investment',
      occurredAt: toOccurredAt(response.occurredAt),
      timeZone: response.timeZone,
      createdAt: toUtcInstant(response.createdAt),
      updatedAt: toUtcInstant(response.updatedAt),
      assetName: response.assetName,
      action: response.action,
      reasoning: response.reasoning,
      emotion: response.emotion,
    };
  }

  return {
    journalId: response.journalId,
    type: 'study',
    occurredAt: toOccurredAt(response.occurredAt),
    timeZone: response.timeZone,
    createdAt: toUtcInstant(response.createdAt),
    updatedAt: toUtcInstant(response.updatedAt),
    title: response.title,
    keyContent: response.keyContent,
    openQuestions: [...response.openQuestions],
  };
}

export function toJournalListViewModels(
  items: JournalListItemResponse[],
): JournalListItemViewModel[] {
  return items.map(toJournalListItemViewModel);
}
