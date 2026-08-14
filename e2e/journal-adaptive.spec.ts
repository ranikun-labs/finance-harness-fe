import { expect, test, type Page } from '@playwright/test';

import {
  APP_ROUTE_PATHS,
  AUTH_ROUTE_PATHS,
  buildAppJournalDetailPath,
  buildAppJournalNewPath,
} from '@/constants/routes';
import { ko } from '@/i18n/messages/ko';

const PRIMARY_ID = 'journal-2026-06-28-01';

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

async function expectBottomNavigation(page: Page, visible: boolean) {
  const navigation = page.getByRole('navigation', { name: ko.nav.ariaLabel });
  if (visible) {
    await expect(navigation).toBeVisible();
  } else {
    await expect(navigation).toBeHidden();
  }
}

test.describe('Journal adaptive List | Detail presentation', () => {
  test('Review handoff keeps the production Auth Entry inert without an external result', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', 'handoff flow runs on Chromium');
    await page.setViewportSize({ width: 393, height: 852 });
    const question = '검토에서 기록으로 이어가기';

    await page.goto(`${APP_ROUTE_PATHS.ask}?q=${encodeURIComponent(question)}`);
    await expect(page.getByRole('heading', { name: ko.app.ask.handoff.heading })).toBeVisible();
    await expect(
      page.getByRole('link', { name: new RegExp(ko.app.ask.handoff.investment.title) }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: new RegExp(ko.app.ask.handoff.study.title) }),
    ).toBeVisible();

    await page.getByRole('link', { name: new RegExp(ko.app.ask.handoff.investment.title) }).click();
    await expect(page).toHaveURL(AUTH_ROUTE_PATHS.entry);
    await page.getByRole('button', { name: ko.auth.entry.providerAction }).click();
    await expect(page).toHaveURL(AUTH_ROUTE_PATHS.entry);
    await expect(page.getByRole('status')).toContainText(ko.auth.entry.unavailable);
    await expect(page.getByRole('heading', { name: ko.auth.entry.heading })).toBeVisible();
  });

  test('Review handoff returns to the exact partial variant without a Journal history loop', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', 'handoff flow runs on Chromium');
    await page.setViewportSize({ width: 393, height: 852 });
    const question = '부분 검토를 다시 확인하기';
    const reviewUrl = `${APP_ROUTE_PATHS.ask}?q=${encodeURIComponent(question)}&fixture=partial`;

    await page.goto(reviewUrl);
    await page.getByRole('link', { name: new RegExp(ko.app.ask.handoff.study.title) }).click();
    await expect(page).toHaveURL(AUTH_ROUTE_PATHS.entry);
    await page.getByRole('button', { name: ko.auth.entry.providerAction }).click();
    await expect(page).toHaveURL(AUTH_ROUTE_PATHS.entry);
    await expect(page.getByRole('status')).toContainText(ko.auth.entry.unavailable);
    await page.getByRole('button', { name: ko.auth.entry.cancel }).click();
    await expect(page).toHaveURL(reviewUrl);
    await expect(
      page.getByRole('heading', { name: ko.app.ask.structured.partialTitle }),
    ).toBeVisible();
    await page.goBack();
    await expect(page).not.toHaveURL(/\/app\/journal\/new/);
  });

  test('keeps Journal List and Detail single-column on Phone', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', 'responsive contract runs on Chromium');
    await page.setViewportSize({ width: 393, height: 852 });

    await page.goto(APP_ROUTE_PATHS.journalList);
    await expect(page.getByTestId('journal-workspace')).toBeVisible();
    await expect(page.locator('.journal-workspace-list-pane')).toBeVisible();
    await expect(page.locator('.journal-workspace-detail-pane')).toBeHidden();
    await expectBottomNavigation(page, true);
    await expectSingleMain(page);
    await expectNoHorizontalOverflow(page);

    await page.goto(buildAppJournalDetailPath(PRIMARY_ID));
    await expect(page.locator('.journal-workspace-list-pane')).toBeHidden();
    await expect(page.locator('.journal-workspace-detail-pane')).toBeVisible();
    await expectBottomNavigation(page, false);
    await expect(page.getByTestId('decision-context-snapshot')).toBeVisible();
    await expectSingleMain(page);
    await expectNoHorizontalOverflow(page);
  });

  test('keeps Tablet Portrait readable and out of the two-pane layout', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', 'responsive contract runs on Chromium');

    for (const viewport of [
      { width: 834, height: 1060 },
      { width: 1024, height: 1366 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(APP_ROUTE_PATHS.journalList);

      const navigation = page.getByTestId('primary-navigation');
      await expect(navigation).toBeVisible();
      const navBox = await navigation.boundingBox();
      expect(navBox).not.toBeNull();
      expect(navBox!.width).toBe(viewport.width);
      expect(navBox!.height).toBeLessThan(100);
      expect(await navigation.evaluate((node) => getComputedStyle(node).flexDirection)).toBe('row');
      await expect(page.locator('.journal-workspace-list-pane')).toBeVisible();
      await expect(page.locator('.journal-workspace-detail-pane')).toBeHidden();
      await expect(page.getByTestId('adaptive-content-host')).toHaveCSS('max-width', '660px');
      await expectSingleMain(page);
      await expectNoHorizontalOverflow(page);
    }
  });

  test('uses the approved contextual two-pane workspace on Tablet Landscape and Desktop', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', 'responsive contract runs on Chromium');

    for (const viewport of [
      { width: 1194, height: 834 },
      { width: 1360, height: 880 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(APP_ROUTE_PATHS.journalList);

      const navigation = page.getByTestId('primary-navigation');
      await expect(navigation).toBeVisible();
      const navBox = await navigation.boundingBox();
      expect(navBox).not.toBeNull();
      expect(navBox!.width).toBe(224);
      expect(await navigation.evaluate((node) => getComputedStyle(node).flexDirection)).toBe(
        'column',
      );

      const workspace = page.getByTestId('journal-workspace');
      await expect(workspace).toBeVisible();
      await expect(workspace.locator('.journal-workspace-list-pane')).toBeVisible();
      await expect(workspace.locator('.journal-workspace-detail-pane')).toBeVisible();
      await expect(
        page.getByRole('heading', { name: ko.app.journalWorkspace.detailPrompt.heading }),
      ).toBeVisible();
      const workspaceBox = await workspace.boundingBox();
      expect(workspaceBox).not.toBeNull();
      expect(workspaceBox!.width).toBeGreaterThan(900);
      await expectSingleMain(page);
      await expectNoHorizontalOverflow(page);

      await page.goto(buildAppJournalDetailPath(PRIMARY_ID));
      await expect(workspace.locator('.journal-workspace-list-pane')).toBeVisible();
      await expect(workspace.locator('.journal-workspace-detail-pane')).toBeVisible();
      await expect(
        workspace.locator('.journal-workspace-list-pane a[aria-current="page"]'),
      ).toHaveAttribute('href', buildAppJournalDetailPath(PRIMARY_ID));
      await expect(page.getByTestId('decision-context-snapshot')).toBeVisible();
      await expectSingleMain(page);
      await expectNoHorizontalOverflow(page);
    }
  });

  test('keeps Journal New a single route surface and carries the Review context seam', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', 'responsive contract runs on Chromium');
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(`${APP_ROUTE_PATHS.ask}?q=${encodeURIComponent('context handoff')}`);
    await page.getByRole('link', { name: ko.app.ask.handoff.investment.title }).click();
    await expect(page).toHaveURL(AUTH_ROUTE_PATHS.entry);
    await page.getByRole('button', { name: ko.auth.entry.providerAction }).click();
    await expect(page.getByRole('status')).toContainText(ko.auth.entry.unavailable);
    await expect(page.getByTestId('auth-entry')).toBeVisible();
  });

  test('shows the entry choice before a Journal New type is selected', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', 'responsive contract runs on Chromium');
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(APP_ROUTE_PATHS.journalNew);

    await expect(
      page.getByRole('heading', { name: ko.app.journalNew.entryChoice.heading }),
    ).toBeVisible();
    await expect(page.getByText(ko.app.journalNew.entryChoice.prompt)).toBeVisible();
    await expect(
      page.getByRole('link', { name: new RegExp(ko.app.journalNew.entryChoice.investment.title) }),
    ).toHaveAttribute('href', AUTH_ROUTE_PATHS.entry);
    await expect(
      page.getByRole('link', { name: new RegExp(ko.app.journalNew.entryChoice.study.title) }),
    ).toHaveAttribute('href', AUTH_ROUTE_PATHS.entry);
    await expect(page.locator('input#assetName')).toHaveCount(0);
    await expectSingleMain(page);
    await expectNoHorizontalOverflow(page);
  });

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
      await page.goto(buildAppJournalNewPath('investment'));

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

  test('keeps Auth Entry as one focused public surface across approved viewports', async ({
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
      await page.goto(AUTH_ROUTE_PATHS.entry);

      await expect(page.getByTestId('auth-entry')).toBeVisible();
      await expect(
        page.getByRole('heading', { level: 1, name: ko.auth.entry.heading }),
      ).toBeVisible();
      await expect(page.getByRole('navigation')).toHaveCount(0);
      await expectSingleMain(page);
      await expectNoHorizontalOverflow(page);
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
      await page.goto(buildAppJournalNewPath('investment'));

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

      await page.goto(buildAppJournalNewPath('study'));
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
