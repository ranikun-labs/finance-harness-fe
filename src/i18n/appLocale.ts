import type { Locale } from '@/constants/routes';
import { DEFAULT_LOCALE, isSupportedLocale } from '@/constants/routes';

/**
 * 앱(`/app/*`) locale 저장 키의 유일한 소유 모듈. 서버 세션이나 cookie에 의존하지
 * 않는다 — Capacitor WebView에서도 `localStorage`가 일반 브라우저처럼 영속되므로
 * 이 하나로 충분하다.
 */
export const APP_LOCALE_STORAGE_KEY = 'finance-harness:app-locale';

/**
 * `navigator.language`/`navigator.languages` 형태(`ko-KR`, `en-US` 등)를 지원
 * locale로 정규화한다. 후보를 순서대로 검사해 첫 매치를 반환하고, 아무것도 지원
 * locale이 아니면 `undefined`.
 */
export function normalizeBrowserLocale(candidates: readonly string[]): Locale | undefined {
  for (const candidate of candidates) {
    const primary = candidate.split(/[-_]/)[0].toLowerCase();
    if (isSupportedLocale(primary)) return primary;
  }
  return undefined;
}

function readNavigatorLocales(): readonly string[] {
  if (typeof navigator === 'undefined') return [];
  if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
    return navigator.languages;
  }
  return navigator.language ? [navigator.language] : [];
}

/**
 * 저장된 값을 읽는다. `localStorage` 접근 실패(프라이빗 모드 등)나 손상된/미지원
 * 값은 모두 "저장값 없음"과 동일하게 `null`로 취급한다 — 호출부가 다음 우선순위
 * 단계로 넘어갈 수 있게.
 */
export function readStoredAppLocale(): Locale | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(APP_LOCALE_STORAGE_KEY);
    if (raw !== null && isSupportedLocale(raw)) return raw;
    return null;
  } catch {
    return null;
  }
}

/**
 * 저장을 시도한다. 실패(quota 초과, 프라이빗 모드 등)해도 조용히 무시한다 — 호출부의
 * React state는 이미 갱신되어 현재 세션 언어는 유지되고, 새로고침 후에만 복원되지
 * 않는 것으로 저하한다(크래시하지 않음).
 */
export function writeStoredAppLocale(locale: Locale): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, locale);
  } catch {
    // no-op — 세션 내 상태는 이미 갱신됐으므로 여기서 더 할 일이 없다.
  }
}

/**
 * 앱(`/app/*`) locale 결정 우선순위: 저장된 유효 locale → 정규화된 브라우저 locale →
 * `DEFAULT_LOCALE`. `window`가 없는 환경(SSR/Pre-render)에서는 즉시
 * `DEFAULT_LOCALE`을 반환한다 — `/app/*`는 Pre-render 대상이 아니라 실행되지 않지만,
 * 이 함수 자체는 SSR 번들에 포함될 수 있으므로 방어적으로 가드한다.
 */
export function resolveInitialAppLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const stored = readStoredAppLocale();
  if (stored) return stored;
  const browser = normalizeBrowserLocale(readNavigatorLocales());
  if (browser) return browser;
  return DEFAULT_LOCALE;
}
