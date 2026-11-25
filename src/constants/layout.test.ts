import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  APP_SHELL_MAX_WIDTH_PX,
  BREAKPOINTS,
  CONTENT_MAX_WIDTH_PX,
  getPrimaryNavPlacement,
  JOURNAL_DETAIL_MAX_WIDTH_PX,
  RESULT_ASIDE_WIDTH_PX,
  RESULT_COLUMN_GAP_PX,
  TOP_NAV_MEDIA_QUERY,
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

  it('keeps the result header literal in lockstep with the aside column and gap', () => {
    const ask = readFileSync('src/pages/AskPage.tsx', 'utf8');
    // 머리 폭 = host − (보조 열 + 간격). Tailwind가 읽으려면 리터럴이어야 하므로 상수와 대조한다.
    expect(ask).toContain(`xl:w-[calc(100%-${RESULT_ASIDE_WIDTH_PX + RESULT_COLUMN_GAP_PX}px)]`);
    // 열 간격은 grid `gap-x-8`(32px)이다.
    expect(RESULT_COLUMN_GAP_PX).toBe(32);
    expect(ask).toContain('gap-x-8');
  });

  it('caps the 2-pane journal detail column at 720 in CSS and keeps it inside the reading measure', () => {
    const css = readFileSync('src/styles/globals.css', 'utf8');
    expect(JOURNAL_DETAIL_MAX_WIDTH_PX).toBe(720);
    expect(css).toMatch(
      new RegExp(`\\.journal-detail-page \\{[^}]*max-width: ${JOURNAL_DETAIL_MAX_WIDTH_PX}px;`),
    );
    // 열 폭이 읽기 본문 상한(max-w-2xl 672)보다 padding(24×2)만큼만 넓어 줄 길이가 늘지 않는다.
    expect(JOURNAL_DETAIL_MAX_WIDTH_PX - 24 * 2).toBe(672);
    expect(CONTENT_MAX_WIDTH_PX.result).toBeGreaterThan(JOURNAL_DETAIL_MAX_WIDTH_PX);
  });

  it('describes the top navigation viewport exactly as getPrimaryNavPlacement does', () => {
    // 상단 = 태블릿(768~1023) + 1024~1279 세로. jsdom에는 matchMedia가 없어 질의 문자열 경계를 대조한다.
    expect(TOP_NAV_MEDIA_QUERY).toContain(
      `(min-width: ${BREAKPOINTS.tablet}px) and (max-width: 1023px)`,
    );
    expect(TOP_NAV_MEDIA_QUERY).toContain(
      `(min-width: ${BREAKPOINTS.rail}px) and (max-width: ${BREAKPOINTS.desktop - 1}px) and (orientation: portrait)`,
    );
    for (const [w, h, expected] of [
      [768, 1024, 'top'],
      [1023, 768, 'top'],
      [1024, 1366, 'top'],
      [1279, 1366, 'top'],
      [1024, 768, 'rail'],
      [1280, 1366, 'rail'],
    ] as const) {
      expect(getPrimaryNavPlacement(w, h)).toBe(expected);
    }
  });
});
