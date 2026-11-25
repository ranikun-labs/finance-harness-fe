import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  APP_SHELL_MAX_WIDTH_PX,
  BREAKPOINTS,
  CONTENT_MAX_WIDTH_PX,
  getPrimaryNavPlacement,
  RESULT_ASIDE_WIDTH_PX,
} from '@/constants/layout';

describe('adaptive layout contract', () => {
  it('maps viewport sizes to the approved navigation placement', () => {
    expect(getPrimaryNavPlacement(320, 640)).toBe('bottom');
    expect(getPrimaryNavPlacement(767, 1024)).toBe('bottom');
    expect(getPrimaryNavPlacement(768, 1024)).toBe('top');
    expect(getPrimaryNavPlacement(1023, 768)).toBe('top');
    // 1024 portrait는 rail이 아니라 상단을 유지한다 (RPL-68).
    expect(getPrimaryNavPlacement(1024, 1366)).toBe('top');
    expect(getPrimaryNavPlacement(1024, 768)).toBe('rail');
    expect(getPrimaryNavPlacement(1279, 1366)).toBe('top');
    expect(getPrimaryNavPlacement(1280, 1366)).toBe('rail');
    expect(getPrimaryNavPlacement(1440, 900)).toBe('rail');
  });

  it('stays in sync with the CSS media queries', () => {
    const css = readFileSync('src/styles/globals.css', 'utf8');
    // portrait 상단 규칙은 desktop(rail) 직전까지만 적용된다 — 상한이 없으면 1280 portrait가 상단으로 샌다.
    expect(css).toContain(
      `(min-width: ${BREAKPOINTS.rail}px) and (max-width: ${BREAKPOINTS.desktop - 1}px) and (orientation: portrait)`,
    );
    expect(css).toContain(`(min-width: ${BREAKPOINTS.desktop}px)`);
    // Tailwind md/lg 기본값(768/1024)에 클래스가 의존한다 — 바뀌면 계약을 함께 갱신한다.
    expect(BREAKPOINTS.tablet).toBe(768);
    expect(BREAKPOINTS.rail).toBe(1024);
  });

  it('keeps the host and content caps ordered', () => {
    expect(APP_SHELL_MAX_WIDTH_PX).toBe(1360);
    expect(CONTENT_MAX_WIDTH_PX.reading).toBeLessThan(CONTENT_MAX_WIDTH_PX.result);
    expect(CONTENT_MAX_WIDTH_PX.result).toBeLessThan(APP_SHELL_MAX_WIDTH_PX);
    expect(CONTENT_MAX_WIDTH_PX.result).toBeLessThan(CONTENT_MAX_WIDTH_PX.resultWithAside);
    expect(CONTENT_MAX_WIDTH_PX.resultWithAside).toBeLessThan(APP_SHELL_MAX_WIDTH_PX);
  });

  it('derives the result-with-aside width from body, gap, aside and padding', () => {
    // 본문 760 + 간격 32 + 보조 열 300 + 좌우 padding 20×2 = 1132.
    expect(CONTENT_MAX_WIDTH_PX.resultWithAside).toBe(
      CONTENT_MAX_WIDTH_PX.result + 32 + RESULT_ASIDE_WIDTH_PX + 40,
    );
    const tabLayout = readFileSync('src/components/layout/TabLayout.tsx', 'utf8');
    expect(tabLayout).toContain(`xl:max-w-[${CONTENT_MAX_WIDTH_PX.resultWithAside}px]`);
    // 보조 열은 desktop breakpoint(xl, 1280)에서만 켜진다.
    expect(BREAKPOINTS.desktop).toBe(1280);
  });
});
