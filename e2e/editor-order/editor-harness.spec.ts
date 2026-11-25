import { expect, test, type Page } from '@playwright/test';

import { ko } from '@/i18n/messages/ko';

// 검토 → 판단 기록 작성(검토 맥락 handoff) 화면의 필드 순서와 폰 접힘(F3 F-02, F-11).
// fixture 기반이며 실제 백엔드 저장·인증·재조회는 검증하지 않는다. 파일명이 editor harness 설정의 testMatch에 걸린다.
const HARNESS = 'http://localhost:49183/e2e/support/order-harness/';

async function openEditorFromReview(page: Page) {
  await page.goto(`${HARNESS}?path=${encodeURIComponent('/app')}`);
  const field = page.locator('#review-question');
  await field.fill('검토 맥락 순서 확인 질문');
  await field.press('Control+Enter');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const cta = page.getByRole('link', {
    name: new RegExp(ko.app.ask.handoff.investment.title),
  });
  await cta.scrollIntoViewIfNeeded();
  await cta.click();
  await expect(page.getByTestId('decision-context-capture')).toBeVisible();
}

test.describe('작성 화면 순서와 폰 접힘 (F-02, F-11)', () => {
  test('390×844: 첫 화면에 "대상" 입력이 보이고 맥락은 한 줄 요약으로 접혀 시작한다', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openEditorFromReview(page);

    // 앞 화면(검토 결과)의 스크롤 이월은 F-PR1이 다룬다. 이 테스트는 배치만 잰다.
    await page.locator('main#main').evaluate((el) => (el.scrollTop = 0));
    const target = page.getByLabel('대상');
    await expect(target).toBeVisible();
    const box = (await target.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(844);

    const panel = page.getByTestId('decision-context-capture');
    const details = panel.locator('details');
    await expect(details).not.toHaveAttribute('open', '');
    await expect(details.locator('summary')).toContainText('확인 항목');
    await expect(panel.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    await details.locator('summary').click();
    await expect(details).toHaveAttribute('open', '');
    await expect(panel.getByText(ko.app.journalNew.decisionContext.immutableNotice)).toBeVisible();
  });

  test('표시 순서와 DOM 순서가 대상 → 판단 → 이유 → 감정 → 기록 시점 → 검토 맥락이다', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openEditorFromReview(page);
    const order = await page.evaluate(() => {
      const form = document.querySelector('main form')!;
      const legend = (text: string) =>
        [...form.querySelectorAll('legend')].find((el) => el.textContent?.includes(text))
          ?.parentElement ?? null;
      const nodes: (Element | null)[] = [
        form.querySelector('#assetName'),
        legend('어떤 판단을 내렸나요?'),
        form.querySelector('#reasoning'),
        legend('판단 당시 상태'),
        [...form.querySelectorAll('button')].find((el) => el.textContent?.includes('변경')) ?? null,
        document.querySelector('[data-testid="decision-context-capture"]'),
      ];
      const missing = nodes.findIndex((node) => node === null);
      const ys = nodes.map((node) => node?.getBoundingClientRect().top ?? -1);
      const domOrdered = nodes.every(
        (node, index) =>
          index === 0 ||
          (nodes[index - 1]!.compareDocumentPosition(node!) & Node.DOCUMENT_POSITION_FOLLOWING) !==
            0,
      );
      return { missing, ys, domOrdered, contextInsideForm: form.contains(nodes[5]) };
    });
    expect(order.missing).toBe(-1);
    expect(order.domOrdered).toBe(true);
    expect([...order.ys].sort((a, b) => a - b)).toEqual(order.ys);
    expect(order.contextInsideForm).toBe(true);
  });

  test('1024: 맥락 본문은 펼친 채 시작한다', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await openEditorFromReview(page);
    await expect(page.getByTestId('decision-context-capture').locator('details')).toHaveAttribute(
      'open',
      '',
    );
  });

  test('스위치·체크박스·취소의 조작 영역은 44 이상이다', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openEditorFromReview(page);
    const panel = page.getByTestId('decision-context-capture');
    await panel.locator('summary').click();

    const sizes = async (locator: ReturnType<Page['locator']>) =>
      locator.evaluateAll((nodes) =>
        nodes.map((node) => {
          const rect = node.getBoundingClientRect();
          return { width: Math.round(rect.width), height: Math.round(rect.height) };
        }),
      );
    for (const size of await sizes(panel.getByRole('switch'))) {
      expect(size.width).toBeGreaterThanOrEqual(44);
      expect(size.height).toBeGreaterThanOrEqual(44);
    }
    // 체크박스 입력은 시각적으로 숨기고 라벨 전체가 터치 영역이다.
    for (const size of await sizes(panel.locator('label'))) {
      expect(size.height).toBeGreaterThanOrEqual(44);
    }
    for (const size of await sizes(page.getByRole('button', { name: /취소/ }))) {
      expect(size.width).toBeGreaterThanOrEqual(44);
      expect(size.height).toBeGreaterThanOrEqual(44);
    }
  });
});
