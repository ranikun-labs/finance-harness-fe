import { expect, test, type Page } from '@playwright/test';
import { buildAppJournalNewPath, buildAppJournalReviewPath } from '@/constants/routes';
import { ko } from '@/i18n/messages/ko';

async function expectNoHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
}
async function expectSingleMain(page: Page) {
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.getByRole('main')).toHaveCount(1);
}

test.describe('Authenticated editor presentation fixture', () => {
  test('keeps Journal New out of the List | Detail workspace at every approved viewport', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', 'responsive contract runs on Chromium');

    for (const viewport of [
      { width: 393, height: 852 },
      { width: 834, height: 1060 },
      { width: 1024, height: 1366 },
      { width: 1194, height: 834 },
      { width: 1360, height: 880 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(
        `http://localhost:49183/e2e/support/editor-harness/?path=${encodeURIComponent(buildAppJournalNewPath('investment'))}`,
      );

      await expect(page.getByRole('heading', { name: ko.app.journalNew.investment })).toBeVisible();
      await expect(page.getByTestId('journal-workspace')).toHaveCount(0);
      await expect(page.locator('.journal-workspace-list-pane')).toHaveCount(0);
      await expect(page.getByTestId('adaptive-content-host')).toHaveCSS('max-width', '660px');
      await expectSingleMain(page);
      await expectNoHorizontalOverflow(page);

      const navigation = page.getByTestId('primary-navigation');
      if (viewport.width < 768) {
        await expect(navigation).toBeHidden();
      } else {
        await expect(navigation).toBeVisible();
      }
    }
  });

  test('exposes the UX-2 editor hierarchy, secondary time, and ordered question controls', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', 'responsive contract runs on Chromium');

    for (const viewport of [
      { width: 393, height: 852 },
      { width: 1024, height: 1366 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(
        `http://localhost:49183/e2e/support/editor-harness/?path=${encodeURIComponent(buildAppJournalNewPath('investment'))}`,
      );

      const decisionForm = page.locator('main form');
      await expect(decisionForm.getByLabel('대상')).toBeVisible();
      await expect(
        decisionForm.getByRole('group', { name: '어떤 판단을 내렸나요?' }),
      ).toBeVisible();
      await expect(decisionForm.getByLabel('왜 그렇게 판단했나요?')).toBeVisible();
      await expect(
        decisionForm.getByRole('group', { name: '판단 당시 상태는 어땠나요? (선택)' }),
      ).toBeVisible();
      await expect(decisionForm.getByRole('button', { name: '기록 시점 변경' })).toBeVisible();
      await expect(decisionForm.locator('input#occurredAt')).toHaveCount(0);
      await expect(decisionForm.getByRole('button', { name: /^판단 기록$/ })).toHaveCount(0);
      await expect(decisionForm.getByRole('button', { name: /^학습 노트$/ })).toHaveCount(0);

      await decisionForm.getByRole('button', { name: '기록 시점 변경' }).click();
      await expect(decisionForm.locator('input#occurredAt')).toHaveAttribute(
        'type',
        'datetime-local',
      );

      await page.goto(
        `http://localhost:49183/e2e/support/editor-harness/?path=${encodeURIComponent(buildAppJournalNewPath('study'))}`,
      );
      const studyForm = page.locator('main form');
      await expect(studyForm.getByLabel('무엇을 배웠나요?')).toBeVisible();
      await expect(studyForm.getByLabel('핵심 정리')).toBeVisible();
      await expect(studyForm.getByLabel(/더 확인할 것/)).toHaveCount(0);
      await studyForm.getByRole('button', { name: '질문 추가' }).click();
      const firstQuestion = studyForm.getByLabel(/더 확인할 것 확인할 질문 1/);
      await firstQuestion.fill('같은 질문');
      await studyForm.getByRole('button', { name: '질문 추가' }).click();
      const secondQuestion = studyForm.getByLabel('확인할 질문 2');
      await secondQuestion.fill('같은 질문');
      await expect(firstQuestion).toHaveValue('같은 질문');
      await expect(secondQuestion).toHaveValue('같은 질문');
      await expect(secondQuestion).toHaveAttribute('maxlength', '500');
      await studyForm.getByRole('button', { name: '질문 1 삭제' }).click();
      await expect(studyForm.getByLabel('확인할 질문 1')).toHaveValue('같은 질문');
    }
  });
});

const leaveDialog = (page: Page) =>
  page.getByRole('alertdialog', { name: ko.common.leaveGuard.title });

test('dirty editor cancel retains input when dismissed and leaves when confirmed', async ({
  page,
}) => {
  await page.goto(
    `http://localhost:49183/e2e/support/editor-harness/?path=${encodeURIComponent(buildAppJournalNewPath('study'))}`,
  );
  const field = page.getByLabel('무엇을 배웠나요?');
  await field.fill('유지할 기록');
  const cancel = page.getByRole('button', { name: '취소' });
  await cancel.focus();
  await expect(cancel).toBeFocused();
  await page.keyboard.press('Enter');
  // window.confirm이 아니라 공통 확인 Dialog다. 안전한 쪽(계속 작성)이 초기 포커스를 받는다.
  const dialog = leaveDialog(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: ko.common.leaveGuard.stay })).toBeFocused();
  await dialog.getByRole('button', { name: ko.common.leaveGuard.stay }).click();
  await expect(dialog).toBeHidden();
  await expect(field).toHaveValue('유지할 기록');
  await expect(cancel).toBeFocused();
  await cancel.click();
  await leaveDialog(page).getByRole('button', { name: ko.common.leaveGuard.leave }).click();
  await expect(page.getByRole('heading', { name: ko.app.journalList.title })).toBeVisible();
});

test.describe('이탈 보호: 브라우저 history·내비·링크 (실제 BrowserRouter, fixture)', () => {
  const browserHarness = (path: string) =>
    `http://localhost:49183/e2e/support/editor-harness/?history=browser&path=${encodeURIComponent(path)}`;

  async function openDraftFromList(page: Page) {
    await page.route('**/finance/journals**', (route) =>
      route.fulfill({
        json: {
          items: [
            {
              journalId: '550e8400-e29b-41d4-a716-446655440000',
              type: 'investment',
              occurredAt: '2026-08-12T14:30:15.123',
              timeZone: 'Asia/Seoul',
              assetName: '반도체 기업 A',
              action: 'interest',
            },
          ],
          nextCursor: null,
        },
      }),
    );
    await page.goto(browserHarness('/app/journal'));
    await page.getByRole('link', { name: ko.app.journalList.newRecord }).first().click();
    await page
      .getByRole('link', { name: new RegExp(ko.app.journalNew.entryChoice.investment.title) })
      .click();
    await expect(page).toHaveURL(/\/app\/journal\/new\?type=investment/);
  }

  test('입력 후 page.goBack()은 확인을 띄우고, 계속 작성하면 입력과 포커스가 그대로다', async ({
    page,
  }) => {
    await openDraftFromList(page);
    const target = page.getByLabel('대상');
    await target.fill('보존할 입력');
    await target.focus();

    await page.goBack();
    const dialog = leaveDialog(page);
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/app\/journal\/new\?type=investment/);

    await dialog.getByRole('button', { name: ko.common.leaveGuard.stay }).click();
    await expect(dialog).toBeHidden();
    await expect(target).toHaveValue('보존할 입력');
    await expect(target).toBeFocused();
    await expect(page).toHaveURL(/\/app\/journal\/new\?type=investment/);

    await page.goBack();
    await leaveDialog(page).getByRole('button', { name: ko.common.leaveGuard.leave }).click();
    await expect(page).toHaveURL(/\/app\/journal\/new$/);
  });

  test('입력이 없으면 page.goBack()에 확인이 없다', async ({ page }) => {
    await openDraftFromList(page);
    await page.goBack();
    await expect(page).toHaveURL(/\/app\/journal\/new$/);
    await expect(leaveDialog(page)).toHaveCount(0);
  });

  test('입력 후 내비 탭에도 같은 확인이 뜬다 (태블릿 834)', async ({ page }) => {
    await page.setViewportSize({ width: 834, height: 1060 });
    await openDraftFromList(page);
    const target = page.getByLabel('대상');
    await target.fill('보존할 입력');
    await page.getByTestId('primary-navigation').getByRole('link', { name: '검토' }).click();
    const dialog = leaveDialog(page);
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleDescription(ko.common.leaveGuard.description);
    await dialog.getByRole('button', { name: ko.common.leaveGuard.stay }).click();
    await expect(target).toHaveValue('보존할 입력');
    await expect(page).toHaveURL(/\/app\/journal\/new\?type=investment/);
  });

  test('복기 작성 중 브라우저 앞으로 가기(history 이동)도 같은 확인을 띄운다', async ({ page }) => {
    await page.route('**/finance/journals**', (route) =>
      route.fulfill({ status: 404, json: { error: 'journal_not_found' } }),
    );
    await page.goto(browserHarness(buildAppJournalReviewPath('journal-2026-06-28-01')));
    const reviewUrl = page.url();
    await page.getByRole('link', { name: ko.app.journalReview.backLabel }).first().click();
    await expect(page).not.toHaveURL(reviewUrl);
    await page.goBack();
    await expect(page).toHaveURL(reviewUrl);

    const body = page.getByLabel(ko.app.journalReview.retrospective.bodyLabel);
    await body.fill('쓰던 복기');
    await page.goForward();
    await expect(leaveDialog(page)).toBeVisible();
    await expect(page).toHaveURL(reviewUrl);
    await leaveDialog(page).getByRole('button', { name: ko.common.leaveGuard.stay }).click();
    await expect(body).toHaveValue('쓰던 복기');
    await expect(page).toHaveURL(reviewUrl);
  });
});

// 폰 작성 화면의 화면 모드(F3 F-08). 인증된 editor harness에서 실제 판단·학습 작성 폼을 본다.
// 저장(테스트 제출)·취소가 닿고, 모드를 바꿔도 입력이 남으며, Dialog를 닫으면 트리거로 포커스가 돌아온다.
test.describe('폰 작성 화면의 화면 모드 (F3 F-08)', () => {
  const PHONE_VIEWPORTS = [
    { width: 320, height: 568 },
    { width: 375, height: 667 },
    { width: 390, height: 844 },
  ];
  const FORMS = [
    { type: 'investment', field: '대상', fieldValue: '보존할 대상' },
    { type: 'study', field: '무엇을 배웠나요?', fieldValue: '보존할 학습 제목' },
  ] as const;

  for (const form of FORMS) {
    test(`${form.type} 작성: 모든 폰 폭에서 첫 입력·저장·취소가 닿고 모드 변경 뒤 입력이 남는다`, async ({
      page,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== 'Desktop Chromium',
        'responsive contract runs on Chromium',
      );

      for (const viewport of PHONE_VIEWPORTS) {
        await page.setViewportSize(viewport);
        await page.emulateMedia({ colorScheme: 'light' });
        await page.goto(
          `http://localhost:49183/e2e/support/editor-harness/?path=${encodeURIComponent(buildAppJournalNewPath(form.type))}`,
        );

        const field = page.getByLabel(form.field);
        await expect(field).toBeVisible();
        const trigger = page.getByTestId('theme-trigger');
        await expect(trigger).toBeVisible();
        expect((await trigger.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);

        // 저장(harness에서는 테스트 제출)과 취소는 스크롤로 닿는다.
        // 저장 버튼은 harness 모드에 따라 문구가 다르므로 폼의 submit 버튼으로 찾는다.
        const save = page.locator('main form button[type="submit"]');
        const cancel = page.getByRole('button', { name: ko.app.journalNew.cancelDirectEntry });
        await save.scrollIntoViewIfNeeded();
        await expect(save).toBeVisible();
        await cancel.scrollIntoViewIfNeeded();
        await expect(cancel).toBeVisible();

        await field.fill(form.fieldValue);
        // 키보드로 트리거에 포커스를 옮기고 Enter로 연다.
        await trigger.focus();
        await expect(trigger).toBeFocused();
        await page.keyboard.press('Enter');
        const dialog = page.getByRole('dialog', { name: ko.theme.title });
        await expect(dialog).toBeVisible();
        await dialog.getByRole('radio', { name: ko.theme.dark, exact: true }).check();
        await page.getByRole('button', { name: ko.theme.close }).click();
        await expect(dialog).toBeHidden();
        await expect(trigger).toBeFocused();
        expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(
          true,
        );
        await expect(field).toHaveValue(form.fieldValue);

        // 다음 폭에서 다시 쓰도록 system/light로 되돌린다(localStorage 상태 초기화 대신 명시 복원).
        await trigger.focus();
        await page.keyboard.press('Enter');
        await dialog.getByRole('radio', { name: ko.theme.light, exact: true }).check();
        await page.getByRole('button', { name: ko.theme.close }).click();
        await expect(dialog).toBeHidden();
      }
    });
  }
});
