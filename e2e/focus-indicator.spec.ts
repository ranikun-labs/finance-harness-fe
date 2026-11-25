import { expect, test } from '@playwright/test';

import { buildAppJournalDetailPath, buildAppJournalReviewPath } from '@/constants/routes';
import { walkTabStops, type Violation } from './support/focusAudit';
import { startReview } from './review-test-flow';

// 포커스 표시 통일(F3 F-06, X-01). Light·Dark. fixture 기반이며 실제 백엔드 검증이 아니다.
const PRIMARY_ID = '550e8400-e29b-41d4-a716-446655440000';

for (const scheme of ['light', 'dark'] as const) {
  test(`${scheme}: 모든 Tab 정지점의 포커스 표시는 2px 실선 + offset 2, 바탕과 3:1 이상`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', '데스크톱 한 번이면 충분하다');
    test.setTimeout(120_000);
    await page.emulateMedia({ colorScheme: scheme });
    await page.setViewportSize({ width: 1440, height: 900 });

    const violations: Violation[] = [];
    const stopsByPath: Record<string, number> = {};
    const visit = async (label: string, goto: () => Promise<void>, minStops = 2) => {
      await goto();
      const walked = await walkTabStops(page, label, minStops);
      violations.push(...walked.violations);
      stopsByPath[label] = walked.stops;
    };

    await visit('/ko', async () => void (await page.goto('/ko')));
    await visit('/ko/features', async () => void (await page.goto('/ko/features')));
    // 운영 기본 빌드의 /auth에는 로그인 수단이 없어 Tab 정지점이 적다(F-14).
    await visit('/auth', async () => void (await page.goto('/auth')), 0);
    await visit('/app', async () => void (await page.goto('/app')));
    // 열린 화면 모드 Dialog 안(라디오 라벨·닫기)도 같은 표시여야 한다.
    await visit('/app theme dialog', async () => {
      await page.goto('/app');
      await page.getByRole('button', { name: /화면 모드/ }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
    });
    await visit('/app/ask', async () => startReview(page, '포커스 표시 대비 확인 질문'));
    await visit('/app/journal', async () => void (await page.goto('/app/journal')));
    await visit(
      '/app/journal/:id',
      async () => void (await page.goto(buildAppJournalDetailPath(PRIMARY_ID))),
    );
    await visit(
      '/app/journal/:id/review',
      async () => void (await page.goto(buildAppJournalReviewPath(PRIMARY_ID))),
    );

    testInfo.annotations.push({ type: 'tab-stops', description: JSON.stringify(stopsByPath) });
    console.log(`${scheme} tab stops`, JSON.stringify(stopsByPath));
    expect(violations, JSON.stringify(violations.slice(0, 12), null, 1)).toEqual([]);
  });
}
