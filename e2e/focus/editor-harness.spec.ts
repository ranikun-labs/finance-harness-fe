import { expect, test } from '@playwright/test';

import { buildAppJournalNewPath } from '@/constants/routes';
import { walkTabStops } from '../support/focusAudit';

// 작성 화면(판단 기록·학습 노트)의 포커스 표시(F3 F-06, X-01). Light·Dark, 폰·데스크톱.
// 파일명이 editor harness 설정의 testMatch에 걸려 기존 harness(인증된 표시 상태, fixture)를 쓴다.
const HARNESS = 'http://localhost:49183/e2e/support/editor-harness/';

for (const scheme of ['light', 'dark'] as const) {
  for (const type of ['investment', 'study'] as const) {
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1280, height: 900 },
    ]) {
      test(`${scheme} ${type} ${viewport.width}: 작성 화면 Tab 정지점의 포커스 표시`, async ({
        page,
      }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.setViewportSize(viewport);
        await page.goto(`${HARNESS}?path=${encodeURIComponent(buildAppJournalNewPath(type))}`);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        const { violations, stops } = await walkTabStops(page, `new:${type}`, 8, 90);
        console.log(`${scheme} ${type} ${viewport.width} tab stops`, stops);
        expect(violations, JSON.stringify(violations.slice(0, 12), null, 1)).toEqual([]);
      });
    }
  }
}
