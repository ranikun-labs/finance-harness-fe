export const PRERENDER_MARKER_ATTRIBUTE = 'data-render-mode';
export const PRERENDER_MARKER_VALUE = 'prerender';

/**
 * client boot이 `hydrateRoot`를 써야 하는지 판별하는 순수 술어. root element의
 * 자식 DOM 존재 여부를 추론하지 않고, `data-render-mode="prerender"` 명시적
 * 속성 값만 검사한다 — `scripts/prerender.mjs`가 Pre-render 산출물의 root에만
 * 이 속성을 부여하고, 순수 SPA shell(`dist/index.html`)에는 부여하지 않는다.
 */
export function shouldHydrate(rootElement: Element): boolean {
  return rootElement.getAttribute(PRERENDER_MARKER_ATTRIBUTE) === PRERENDER_MARKER_VALUE;
}
