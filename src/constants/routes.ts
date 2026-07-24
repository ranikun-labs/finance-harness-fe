/**
 * 유일한 라우트 정의처. 경로 문자열을 다른 곳에 하드코딩하지 말고 이 모듈을 통해서만
 * 참조한다. 라우트 목록 기준 문서: docs/nav-map.md, 라우팅 경계 설계: docs/route-architecture.md
 *
 * URL은 두 소유 도메인으로 나뉜다.
 * - 공개 웹:  `/:locale` (ko|en) — 정적 Pre-render 목표(STEP 6)
 * - 웹앱/Capacitor: `/app/*` — SPA
 * 프리픽스 없는 콘텐츠 경로는 없다. 루트 `/`는 기본 로케일로 redirect 전용이다.
 */

// ── 로케일 단일 원본 ────────────────────────────────────────────────
export const SUPPORTED_LOCALES = ['ko', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ko';

/** 지원 로케일 판별의 유일한 검증 원본. i18n 라이브러리·언어 감지는 도입하지 않는다. */
export function isSupportedLocale(value: string | undefined): value is Locale {
  return value !== undefined && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

// ── 앱 URL 프리픽스 단일 원본 ───────────────────────────────────────
export const APP_BASE = '/app';

// ── 공개 웹 라우트 (locale 파라미터 패턴) ───────────────────────────
export const PUBLIC_ROUTE_PATHS = {
  localeHome: '/:locale',
  features: '/:locale/features',
  learn: '/:locale/learn/*',
} as const;

// ── 웹앱 라우트 (APP_BASE 프리픽스, 단일 정의) ──────────────────────
export const APP_ROUTE_PATHS = {
  appHome: APP_BASE,
  onboarding: `${APP_BASE}/onboarding`,
  ask: `${APP_BASE}/ask`,
  journalList: `${APP_BASE}/journal`,
  journalNew: `${APP_BASE}/journal/new`,
  journalDetail: `${APP_BASE}/journal/:id`,
  journalReview: `${APP_BASE}/journal/:id/review`,
} as const;

export type JournalEntryType = 'investment' | 'study';

/**
 * AppRouter의 최상위 `<Route>`는 절대 경로를 받지만, 중첩 `<Route>`는 부모 기준 상대
 * 경로를 받는다. ROUTE 상수는 절대 경로이므로 이 헬퍼로 선행 슬래시를 제거해 재사용한다.
 */
export function toRelativeRoutePath(absolutePath: string): string {
  return absolutePath.replace(/^\//, '');
}

/**
 * `toRelativeUnder`는 React Router의 pathname pattern(`/app`, `/:locale`, `:id`, `*` 등)
 * 전용 helper다. 쿼리 문자열이나 fragment가 섞인 값을 받을 대상이 아니므로 명시적으로
 * 거부한다.
 */
function assertPathnamePattern(label: 'base' | 'absolutePath', value: string): void {
  if (value === '') {
    throw new Error(`toRelativeUnder: "${label}"는 빈 문자열일 수 없습니다.`);
  }
  if (!value.startsWith('/')) {
    throw new Error(`toRelativeUnder: "${label}" "${value}"는 "/"로 시작해야 합니다.`);
  }
  if (value.includes('?') || value.includes('#')) {
    throw new Error(
      `toRelativeUnder: "${label}" "${value}"에 "?" 또는 "#"를 포함할 수 없습니다 ` +
        '(React Router pathname pattern 전용 helper입니다).',
    );
  }
}

/**
 * `base`(예: `/app`, `/:locale`) 아래 중첩 `<Route>`에 넘길 상대 경로를 만든다.
 * `absolutePath`가 `base`와 정확히 같으면 index 라우트를 뜻하는 빈 문자열을 반환한다.
 * `base` 하위가 아니면 라우트 트리 정의가 예상과 어긋났다는 뜻이므로 즉시 에러를 던진다.
 */
export function toRelativeUnder(base: string, absolutePath: string): string {
  assertPathnamePattern('base', base);
  assertPathnamePattern('absolutePath', absolutePath);
  if (absolutePath === base) return '';
  const prefix = `${base}/`;
  if (!absolutePath.startsWith(prefix)) {
    throw new Error(`"${absolutePath}"는 base "${base}" 아래 경로가 아닙니다.`);
  }
  return absolutePath.slice(prefix.length);
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

const JOURNAL_ID_PLACEHOLDER = ':id';

/**
 * ROUTE 패턴의 동적 라우트에서 `:id` placeholder를 인코딩된 값으로 치환한다.
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

// ── 공개 웹 path builder ────────────────────────────────────────────
function assertSupportedLocale(locale: Locale): Locale {
  if (!isSupportedLocale(locale)) {
    throw new Error(`지원하지 않는 locale입니다: "${locale}"`);
  }
  return locale;
}

export function buildLocaleHomePath(locale: Locale): string {
  return `/${assertSupportedLocale(locale)}`;
}

export function buildFeaturesPath(locale: Locale): string {
  return `/${assertSupportedLocale(locale)}/features`;
}

export function buildLearnPath(locale: Locale, ...segments: string[]): string {
  const base = `/${assertSupportedLocale(locale)}/learn`;
  if (segments.length === 0) return base;
  const suffix = segments.map((segment) => encodeURIComponent(segment)).join('/');
  return `${base}/${suffix}`;
}

/**
 * 공개 웹(`/:locale/*`) pathname의 첫 세그먼트(locale)만 `targetLocale`로 치환하고
 * 나머지(`/features`, `/learn/basics` 등)는 그대로 보존한다. `LocaleSwitcher`
 * 전용 helper — query string·hash는 이 함수의 책임이 아니다(pathname만 다룬다,
 * 호출부가 `useLocation()`의 `search`/`hash`를 별도로 유지해야 한다).
 */
export function buildLocalePeerPath(pathname: string, targetLocale: Locale): string {
  assertPathnamePattern('absolutePath', pathname);
  assertSupportedLocale(targetLocale);
  const segments = pathname.split('/');
  if (segments.length < 2 || segments[1] === '') {
    throw new Error(`buildLocalePeerPath: "${pathname}"에서 locale 세그먼트를 찾을 수 없습니다.`);
  }
  segments[1] = targetLocale;
  return segments.join('/');
}

// ── 웹앱 path builder (기존 쿼리·인코딩 계약 보존) ─────────────────
export function buildAppAskPath(query?: string): string {
  if (!query) return APP_ROUTE_PATHS.ask;
  const params = new URLSearchParams({ q: query });
  return `${APP_ROUTE_PATHS.ask}?${params.toString()}`;
}

export function buildAppJournalNewPath(type: JournalEntryType): string {
  const params = new URLSearchParams({ type });
  return `${APP_ROUTE_PATHS.journalNew}?${params.toString()}`;
}

export function buildAppJournalDetailPath(id: string): string {
  return substituteJournalId(APP_ROUTE_PATHS.journalDetail, id);
}

export function buildAppJournalReviewPath(id: string): string {
  return substituteJournalId(APP_ROUTE_PATHS.journalReview, id);
}
