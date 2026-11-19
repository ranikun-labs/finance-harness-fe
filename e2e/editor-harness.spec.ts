import { expect, test, type Page } from '@playwright/test';
import { buildAppJournalNewPath } from '@/constants/routes';
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
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.keyboard.press('Enter');
  await expect(field).toHaveValue('유지할 기록');
  await expect(cancel).toBeFocused();
  page.once('dialog', (dialog) => dialog.accept());
  await cancel.click();
  await expect(page.getByRole('heading', { name: ko.app.journalList.title })).toBeVisible();
});
