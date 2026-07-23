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

/**
 * AppRouter의 중첩 `<Route>`는 부모(AppShell) 기준 상대 경로를 받는다.
 * ROUTE_PATHS는 절대 경로(`/`로 시작)로 정의되어 있으므로, 라우터 트리 정의에서
 * 이 헬퍼로 선행 슬래시를 제거해 재사용한다.
 */
export function toRelativeRoutePath(absolutePath: string): string {
  return absolutePath.replace(/^\//, '');
}

/**
 * 동적 id 경로 세그먼트를 만든다. id는 인코딩되지 않은 원본 값을 전달해야 한다 —
 * 이 함수가 내부적으로 encodeURIComponent를 적용하므로, 호출부에서 미리 인코딩된
 * 값을 넘기면 이중 인코딩된다. 빈 문자열이거나 공백만 있는 id는 명시적으로 거부한다.
 */
function encodeJournalId(id: string): string {
  if (id.trim() === '') {
    throw new Error('journal id는 빈 문자열이거나 공백만으로 구성될 수 없습니다.');
  }
  return encodeURIComponent(id);
}

export function buildAskPath(query?: string): string {
  if (!query) return ROUTE_PATHS.ask;
  const params = new URLSearchParams({ q: query });
  return `${ROUTE_PATHS.ask}?${params.toString()}`;
}

export function buildJournalNewPath(type: JournalEntryType): string {
  const params = new URLSearchParams({ type });
  return `${ROUTE_PATHS.journalNew}?${params.toString()}`;
}

const JOURNAL_ID_PLACEHOLDER = ':id';

/**
 * ROUTE_PATHS의 동적 라우트 패턴에서 `:id` placeholder를 인코딩된 값으로 치환한다.
 * placeholder가 정확히 한 번 존재하지 않으면 라우트 패턴이 예상과 달라졌다는 뜻이므로,
 * 조용히 잘못된 URL을 반환하는 대신 즉시 에러를 던진다.
 */
function substituteJournalId(pattern: string, id: string): string {
  const occurrences = pattern.split(JOURNAL_ID_PLACEHOLDER).length - 1;
  if (occurrences !== 1) {
    throw new Error(
      `라우트 패턴 "${pattern}"에 "${JOURNAL_ID_PLACEHOLDER}" placeholder가 정확히 1개 있어야 합니다.`,
    );
  }
  return pattern.replace(JOURNAL_ID_PLACEHOLDER, encodeJournalId(id));
}

export function buildJournalDetailPath(id: string): string {
  return substituteJournalId(ROUTE_PATHS.journalDetail, id);
}

export function buildJournalReviewPath(id: string): string {
  return substituteJournalId(ROUTE_PATHS.journalReview, id);
}
