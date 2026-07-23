/**
 * 유일한 라우트 정의처. 경로 문자열을 다른 곳에 하드코딩하지 말고 이 모듈을 통해서만 참조한다.
 * 라우트 목록의 기준 문서: docs/nav-map.md
 */
export const ROUTE_PATHS = {
  onboarding: '/onboarding',
  home: '/',
  ask: '/ask',
  journalList: '/journal',
  journalNew: '/journal/new',
  journalDetail: '/journal/:id',
  journalReview: '/journal/:id/review',
} as const;

export type JournalEntryType = 'investment' | 'study';

export function buildAskPath(query?: string): string {
  if (!query) return ROUTE_PATHS.ask;
  const params = new URLSearchParams({ q: query });
  return `${ROUTE_PATHS.ask}?${params.toString()}`;
}

export function buildJournalNewPath(type: JournalEntryType): string {
  const params = new URLSearchParams({ type });
  return `${ROUTE_PATHS.journalNew}?${params.toString()}`;
}

export function buildJournalDetailPath(id: string): string {
  return `/journal/${id}`;
}

export function buildJournalReviewPath(id: string): string {
  return `/journal/${id}/review`;
}
