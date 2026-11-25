import { expect, test, type Page } from '@playwright/test';

import { ko } from '@/i18n/messages/ko';

// 수정·삭제·복원 UI(F3 F-05): 앱바 텍스트 행동, 삭제 안내는 확인 Dialog 안, 삭제한 기록은 목록 끝.
// 이 UI는 비운영 참조 인증 플래그 뒤에 있다. 서버 응답은 harness의 fetch 대역(fixture)이며 실제 백엔드가 아니다.
const HARNESS = 'http://localhost:49183/e2e/support/lifecycle-harness/';

type Call = { method: string; path: string };
const callsOf = (page: Page): Promise<Call[]> =>
  page.evaluate(() => (window as unknown as { __lifecycleCalls: Call[] }).__lifecycleCalls);

async function signInAndOpenDetail(page: Page) {
  await page.goto(HARNESS);
  await page.getByLabel(ko.auth.entry.referenceUserId).fill('fixture-user');
  await page.getByLabel(ko.auth.entry.referencePassword).fill('fixture-password');
  await page.getByTestId('finance-reference-login').click();
  await page.getByRole('link', { name: ko.nav.journal }).first().click();
  await page
    .getByRole('link', { name: /반도체 기업 A/ })
    .first()
    .click();
  await expect(page.getByRole('button', { name: ko.journalLifecycle.remove })).toBeVisible();
}

const boxOf = async (locator: ReturnType<Page['locator']>) => (await locator.boundingBox())!;

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1280, height: 900 },
]) {
  test(`${viewport.width}: 수정·삭제는 앱바 텍스트 버튼이고 삭제를 취소하면 기록이 유지된다`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await signInAndOpenDetail(page);

    const detailPage = page.locator('.journal-detail-page').first();
    const header = detailPage.locator('> header');
    const edit = header.getByRole('button', { name: ko.journalEdit.edit });
    const remove = header.getByRole('button', { name: ko.journalLifecycle.remove });
    await expect(edit).toBeVisible();
    await expect(remove).toBeVisible();
    // 삭제 안내 문단은 Dialog를 열기 전에는 화면 어디에도 없다.
    await expect(page.getByText(ko.journalLifecycle.retained)).toHaveCount(0);
    // 조작 영역 44 이상, 기록 머리가 상세의 첫 요소다.
    for (const button of [edit, remove]) {
      const box = await boxOf(button);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
    const firstTag = await detailPage.evaluate((el) => el.firstElementChild?.tagName);
    expect(firstTag).toBe('HEADER');

    await remove.focus();
    await remove.press('Enter');
    const dialog = page.getByRole('alertdialog', { name: ko.journalLifecycle.remove });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(ko.journalLifecycle.retained);
    await expect(dialog.getByRole('button', { name: ko.journalEdit.cancel })).toBeFocused();

    await dialog.getByRole('button', { name: ko.journalEdit.cancel }).click();
    await expect(dialog).toBeHidden();
    await expect(remove).toBeFocused();
    expect((await callsOf(page)).filter((call) => call.path.endsWith('/delete'))).toHaveLength(0);
    await expect(detailPage.getByText('반도체 기업 A').first()).toBeVisible();

    // 확정하면 delete 요청이 한 번 나간다.
    await remove.click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: ko.journalLifecycle.confirm })
      .click();
    await expect
      .poll(async () => (await callsOf(page)).filter((call) => call.path.endsWith('/delete')))
      .toHaveLength(1);
  });
}

test('삭제한 기록은 목록 끝의 텍스트 링크이고 복원 버튼은 44 이상이다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(HARNESS);
  await page.getByLabel(ko.auth.entry.referenceUserId).fill('fixture-user');
  await page.getByLabel(ko.auth.entry.referencePassword).fill('fixture-password');
  await page.getByTestId('finance-reference-login').click();
  await page
    .getByRole('button', { name: ko.nav.journal })
    .or(page.getByRole('link', { name: ko.nav.journal }))
    .first()
    .click();

  const toggle = page.getByRole('button', { name: ko.journalLifecycle.deletedList });
  await expect(toggle).toBeVisible();
  // 첫 줄이 아니라 목록(기록 행) 뒤에 있다.
  const rowBox = await boxOf(page.getByRole('link', { name: /반도체 기업 A/ }).first());
  const toggleBox = await boxOf(toggle);
  expect(toggleBox.y).toBeGreaterThan(rowBox.y);
  expect(toggleBox.height).toBeGreaterThanOrEqual(44);

  await toggle.click();
  const restore = page.getByRole('button', { name: ko.journalLifecycle.restore });
  await expect(restore).toBeVisible();
  expect((await boxOf(restore)).height).toBeGreaterThanOrEqual(44);
});
