import {
  SUPPORTED_LOCALES,
  buildFeaturesPath,
  buildLearnPath,
  buildLocaleHomePath,
} from '@/constants/routes';

export interface PrerenderManifestEntry {
  /** BrowserRouter가 매칭할 절대 경로. `src/entry-server.tsx`의 `render(path)`에 그대로 전달된다. */
  path: string;
  /** `dist/` 기준 산출 파일 상대 경로. */
  outFile: string;
}

/**
 * STEP 6에서 정적 HTML로 생성할 공개 웹 고정 경로 목록. `SUPPORTED_LOCALES`와
 * 공개 path builder(`src/constants/routes.ts`)에서 파생하며, 별도 문자열 배열을
 * 하드코딩하지 않는다 — `SUPPORTED_LOCALES`가 늘어나면 이 매니페스트도 함께 늘어난다.
 *
 * `/:locale/learn/*`(wildcard)는 실제 학습 콘텐츠 목록이 없어 유한한 경로 집합을
 * 나열할 수 없으므로 인덱스(`/:locale/learn`)만 포함하고 하위 slug는 제외한다.
 * 콘텐츠 manifest가 생기면 이 함수에 목록을 주입할 확장 포인트가 될 수 있으나,
 * 지금은 가짜 데이터를 넣지 않는다.
 *
 * 이 모듈은 렌더러(React/react-dom/react-router)에 의존하지 않는 순수 함수이므로
 * Vite SSR 빌드 없이 Vitest가 직접 import해 단위 테스트할 수 있다.
 */
export function buildPrerenderManifest(): PrerenderManifestEntry[] {
  return SUPPORTED_LOCALES.flatMap((locale) => [
    { path: buildLocaleHomePath(locale), outFile: `${locale}/index.html` },
    { path: buildFeaturesPath(locale), outFile: `${locale}/features/index.html` },
    { path: buildLearnPath(locale), outFile: `${locale}/learn/index.html` },
  ]);
}

export const PRERENDER_MANIFEST: PrerenderManifestEntry[] = buildPrerenderManifest();
