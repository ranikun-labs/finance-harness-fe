/**
 * Adaptive layout 계약 값의 단일 원본 (RPL-68 계약 + RPL-146 코드화).
 *
 * 값은 Tailwind 기본 breakpoint(`md`/`lg`/`xl`)와 일치한다 — 새 값을 만들지 않고 RPL-68이
 * 승인한 viewport 구분을 이름 붙여 노출한다. 클래스(`md:`/`lg:`)와 CSS media query가
 * 이 값과 어긋나지 않는지는 `layout.test.ts`가 소스를 직접 대조해 검증한다.
 */
export const BREAKPOINTS = {
  /** Phone(<768) → Tablet. 하단 탭 → 상단 primary navigation. Tailwind `md`. */
  tablet: 768,
  /** Landscape 이상(≥1024 landscape) → 좌측 rail. 1024 portrait는 상단 유지. Tailwind `lg`. */
  rail: 1024,
  /** Desktop. orientation과 무관하게 rail. Tailwind `xl`. */
  desktop: 1280,
} as const;

/**
 * 본문 landmark(`<main>`)의 id. SkipLink의 `#main` 대상이다 — JS 없이도 앵커로 이동하도록
 * 앱 셸 안의 모든 `<main>`이 같은 id를 가진다(한 번에 하나만 렌더).
 */
export const MAIN_LANDMARK_ID = 'main';

/** 앱 host 최대 폭(px). 그 이하에서는 viewport 폭을 전부 쓴다. */
export const APP_SHELL_MAX_WIDTH_PX = 1360;

/** 콘텐츠 host 최대 폭(px). 줄 길이(readable measure)를 지키기 위한 상한. */
export const CONTENT_MAX_WIDTH_PX = {
  /** 기본 읽기 단일 column. */
  reading: 660,
  /** 검토 결과 등 구조화된 결과 화면. */
  result: 760,
  /**
   * 검토 결과 + 보조 열(≥1280). 본문 760 + 열 간격 32 + 보조 열 300 + 좌우 padding 40.
   * 보조 열은 결과 화면 안의 구성이다(질문|결과 2-pane이 아님, F1-01 §5.3).
   */
  resultWithAside: 1132,
} as const;

/** 결과 화면 보조 열("기록으로 이어가기") 폭(px). 본문 끝 블록만 옆으로 옮긴다. */
export const RESULT_ASIDE_WIDTH_PX = 300;

/** 결과 화면 본문 열과 보조 열 사이 간격(px). 본문 열 정렬(머리 폭)과 host 폭 계산이 함께 쓴다. */
export const RESULT_COLUMN_GAP_PX = 32;

/**
 * 2-pane(List | Detail) 상세 열의 최대 폭(px, 좌우 padding 포함). 상세 pane이 이보다 넓어져도
 * (≥1360 host) 줄 길이가 늘지 않도록 열을 가운데에 묶는다. 안쪽 읽기 본문은 `max-w-2xl`(672)이라
 * 720 − padding 24×2 = 672로 열 폭과 줄 길이가 같다. 값은 Tailwind 스케일 밖이라 CSS
 * (`.journal-detail-page`)가 쓰고, `layout.test.ts`가 CSS 리터럴과 이 상수를 대조한다.
 */
export const JOURNAL_DETAIL_MAX_WIDTH_PX = 720;

/** WCAG 2.5.8 하한(24)이 아니라 Foundation 터치 최소(44)를 따른다. */
export const TOUCH_TARGET_MIN_PX = 44;

/**
 * Primary navigation이 상단에 놓이는 viewport(`getPrimaryNavPlacement`의 `'top'`)의 media query.
 * 상단일 때 내비는 앱 헤더의 제품 이름·로그인과 같은 한 줄에 놓인다(DOM도 헤더 안으로 옮겨진다).
 */
export const TOP_NAV_MEDIA_QUERY = [
  `(min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.rail - 1}px)`,
  `(min-width: ${BREAKPOINTS.rail}px) and (max-width: ${BREAKPOINTS.desktop - 1}px) and (orientation: portrait)`,
].join(', ');

/** Primary navigation이 놓이는 위치. viewport 폭·orientation으로 결정된다. */
export type PrimaryNavPlacement = 'bottom' | 'top' | 'rail';

/**
 * CSS(`md:`/`lg:` + portrait media query)가 실제로 적용하는 규칙의 순수 함수 표현.
 * 렌더링에는 쓰지 않고(스타일은 CSS가 소유), 계약 문서화와 테스트의 기준으로만 쓴다.
 */
export function getPrimaryNavPlacement(width: number, height: number): PrimaryNavPlacement {
  if (width < BREAKPOINTS.tablet) return 'bottom';
  if (width >= BREAKPOINTS.desktop) return 'rail';
  if (width >= BREAKPOINTS.rail && width > height) return 'rail';
  return 'top';
}
