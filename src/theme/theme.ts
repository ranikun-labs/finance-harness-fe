/**
 * 화면 모드(시스템/라이트/다크)의 유일한 소유 모듈.
 *
 * - 선택은 이 기기의 `localStorage`에만 저장한다(서버·계정과 동기화하지 않는다).
 * - 저장값이 없으면 `system`: OS의 `prefers-color-scheme`을 따르고, 바뀌면 즉시 반영한다.
 * - 적용 결과는 `<html>`의 `.dark` 클래스 + `color-scheme` + `theme-color` meta 세 곳이다.
 * - 첫 페인트 깜빡임을 막는 `index.html`의 인라인 스크립트가 같은 키·같은 규칙을 복제한다
 *   (`theme.test.ts`가 둘의 결과를 대조한다). 규칙을 바꾸면 두 곳을 함께 바꾼다.
 */
export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'finance-harness:theme';
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';
export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

/** 브라우저 UI(주소창·상태바) 색. `--page` 토큰과 같은 값이다(globals.css, theme.test.ts가 대조). */
export const THEME_COLOR: Record<ResolvedTheme, string> = {
  light: '#f2f4f6',
  dark: '#0f1114',
};

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value);
}

/** 저장값을 읽는다. 접근 실패·손상·미지원 값은 모두 "저장값 없음"(`null`)이다. */
export function readStoredThemePreference(): ThemePreference | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(raw) ? raw : null;
  } catch {
    return null;
  }
}

/**
 * 저장을 시도한다. 실패(프라이빗 모드·quota)해도 현재 화면의 모드는 이미 바뀌어 있고
 * 새로고침 후에만 복원되지 않는다. 반환값은 저장 성공 여부다.
 * `system`은 키를 지워 "아직 고르지 않음"과 같게 둔다.
 */
export function writeStoredThemePreference(preference: ThemePreference): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if (preference === DEFAULT_THEME_PREFERENCE) {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, preference);
    }
    return true;
  } catch {
    return false;
  }
}

export function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(DARK_SCHEME_QUERY).matches;
}

export function resolveTheme(preference: ThemePreference, prefersDark: boolean): ResolvedTheme {
  if (preference === 'system') return prefersDark ? 'dark' : 'light';
  return preference;
}

function ensureMeta(name: string): HTMLMetaElement {
  let meta = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }
  return meta;
}

/** 해석된 테마를 문서에 반영한다. DOM만 바꾸므로 React 트리·입력 상태는 다시 마운트되지 않는다. */
export function applyResolvedTheme(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
  ensureMeta('color-scheme').content = resolved;
  ensureMeta('theme-color').content = THEME_COLOR[resolved];
}

// ── 외부 스토어(React `useSyncExternalStore` 호환) ────────────────────────────
let preference: ThemePreference = DEFAULT_THEME_PREFERENCE;
let initialized = false;
let teardown: (() => void) | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function sync() {
  applyResolvedTheme(resolveTheme(preference, systemPrefersDark()));
}

/**
 * 앱 시작 시 한 번 호출한다. 저장값을 읽어 적용하고, 시스템 설정 변경과 다른 탭의 선택
 * 변경(`storage` 이벤트)을 구독한다. 반환 함수는 구독 해제다(테스트용).
 */
export function initTheme(): () => void {
  teardown?.();
  preference = readStoredThemePreference() ?? DEFAULT_THEME_PREFERENCE;
  initialized = true;
  sync();
  emit();

  if (typeof window === 'undefined') return () => undefined;
  const media =
    typeof window.matchMedia === 'function' ? window.matchMedia(DARK_SCHEME_QUERY) : null;
  const onSystemChange = () => {
    sync();
    emit();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== THEME_STORAGE_KEY) return;
    preference = readStoredThemePreference() ?? DEFAULT_THEME_PREFERENCE;
    sync();
    emit();
  };
  media?.addEventListener('change', onSystemChange);
  window.addEventListener('storage', onStorage);
  teardown = () => {
    media?.removeEventListener('change', onSystemChange);
    window.removeEventListener('storage', onStorage);
    teardown = null;
    initialized = false;
  };
  return teardown;
}

export function getThemePreference(): ThemePreference {
  if (!initialized) {
    preference = readStoredThemePreference() ?? DEFAULT_THEME_PREFERENCE;
  }
  return preference;
}

/** 선택을 바꾼다. 즉시 적용하고 저장한다(저장 실패는 현재 화면 적용에 영향 없음). */
export function setThemePreference(next: ThemePreference): { persisted: boolean } {
  if (!isThemePreference(next)) return { persisted: false };
  preference = next;
  const persisted = writeStoredThemePreference(next);
  sync();
  emit();
  return { persisted };
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getResolvedTheme(): ResolvedTheme {
  return resolveTheme(getThemePreference(), systemPrefersDark());
}
