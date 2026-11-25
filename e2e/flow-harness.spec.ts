import { expect, test, type Page } from '@playwright/test';

import { ko } from '@/i18n/messages/ko';

// 실제 브라우저 history(BrowserRouter)와 인증된 표시 상태를 쓰는 화면 이동 계약 검증.
// fixture 기반이며 실제 백엔드 저장·인증·재조회는 검증하지 않는다.
const HARNESS = 'http://localhost:49183/e2e/support/flow-harness/';

const PRIMARY_ID = '550e8400-e29b-41d4-a716-446655440000';
const SECOND_ID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

async function openHarness(page: Page, path: string) {
  await page.goto(`${HARNESS}?path=${encodeURIComponent(path)}`);
}

async function mockJournals(page: Page) {
  const base = {
    type: 'investment',
    occurredAt: '2026-08-12T14:30:15.123',
    timeZone: 'Asia/Seoul',
    action: 'interest',
  };
  const items = [
    { ...base, journalId: PRIMARY_ID, assetName: '반도체 기업 A' },
    { ...base, journalId: SECOND_ID, assetName: '배터리 기업 C', action: 'watching' },
  ];
  await page.route('**/finance/journals**', async (route) => {
    const url = new URL(route.request().url());
    const id = url.pathname.split('/finance/journals/')[1];
    if (!id) return route.fulfill({ json: { items, nextCursor: null } });
    const item = items.find((entry) => entry.journalId === id);
    if (!item) return route.fulfill({ status: 404, json: { error: 'journal_not_found' } });
    return route.fulfill({
      json: {
        ...item,
        createdAt: '2026-08-12T05:31:02.123Z',
        updatedAt: '2026-08-12T05:31:02.123Z',
        reasoning: '수급 흐름을 확인한 뒤 지켜보기로 했다.',
        emotion: '확신',
      },
    });
  });
}

async function startReview(page: Page, question: string) {
  await openHarness(page, '/app');
  const field = page.locator('#review-question');
  await field.fill(question);
  await field.press('Control+Enter');
  await expect(page).toHaveURL(/\/app\/ask\?ref=/);
  await expect(page.locator('h1')).toBeVisible();
}

async function scrollResultToEnd(page: Page) {
  await expect(
    page.getByRole('link', { name: new RegExp(ko.app.ask.handoff.investment.title) }),
  ).toBeVisible();
  await page.locator('main#main').evaluate((el) => el.scrollTo(0, el.scrollHeight));
}

const scrollTopOfMain = (page: Page) => page.locator('main#main').evaluate((el) => el.scrollTop);

test.describe('화면 이동 시 스크롤·포커스 (F-01, F-10)', () => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
  ]) {
    test(`${viewport.width}: 결과 맨 아래에서 작성 화면으로 가면 스크롤 0·제목 포커스`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await startReview(page, '스크롤 초기화 확인 질문');
      const cta = page.getByRole('link', { name: new RegExp(ko.app.ask.handoff.investment.title) });
      await scrollResultToEnd(page);
      expect(await scrollTopOfMain(page)).toBeGreaterThan(200);

      await cta.click();
      await expect(page).toHaveURL(/\/app\/journal\/new/);
      const heading = page.getByRole('heading', { level: 1 }).first();
      await expect(heading).toBeVisible();
      await expect(heading).toBeFocused();
      expect(await scrollTopOfMain(page)).toBe(0);
      const box = await heading.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.y).toBeGreaterThanOrEqual(0);
    });
  }

  test('1440: 결과 화면 결과 CTA를 눌러도 작성 화면 제목이 보이는 위치에 있다', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await startReview(page, '넓은 화면 스크롤 초기화');
    await scrollResultToEnd(page);
    await page.getByRole('link', { name: new RegExp(ko.app.ask.handoff.investment.title) }).click();
    await expect(page).toHaveURL(/\/app\/journal\/new/);
    const heading = page.getByRole('heading', { level: 1 }).first();
    await expect(heading).toBeFocused();
    expect(await scrollTopOfMain(page)).toBe(0);
    const box = await heading.boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(0);
  });

  test('브라우저 뒤로 가기는 결과 화면의 이전 스크롤 위치를 복원한다', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await startReview(page, '뒤로 가기 스크롤 복원');
    await scrollResultToEnd(page);
    await page.locator('main#main').evaluate((el) => el.scrollTo(0, 300));
    const before = await scrollTopOfMain(page);
    expect(before).toBeGreaterThan(200);
    await page.getByRole('link', { name: new RegExp(ko.app.ask.handoff.investment.title) }).click();
    await expect(page).toHaveURL(/\/app\/journal\/new/);
    await expect.poll(() => scrollTopOfMain(page)).toBe(0);

    await page.goBack();
    await expect(page).toHaveURL(/\/app\/ask\?ref=/);
    await expect.poll(() => scrollTopOfMain(page)).toBeGreaterThanOrEqual(before - 2);
  });

  test('1440 2-pane: 목록 행을 고르면 상세 제목으로 포커스가 간다', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockJournals(page);
    await openHarness(page, '/app/journal');
    const row = page.locator('.journal-workspace-list-pane a', { hasText: '배터리 기업 C' });
    await row.click();
    await expect(page).toHaveURL(new RegExp(`/app/journal/${SECOND_ID}`));
    const detailHeading = page.locator('.journal-workspace-detail-pane h1');
    await expect(detailHeading).toBeFocused();
  });
});
