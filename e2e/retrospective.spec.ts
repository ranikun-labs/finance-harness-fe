import { expect, test, type Page } from '@playwright/test';

import {
  APP_ROUTE_PATHS,
  buildAppJournalDetailPath,
  buildAppJournalReviewPath,
} from '@/constants/routes';
import { ko } from '@/i18n/messages/ko';

const FIXTURE_PRIMARY_ID = 'journal-2026-06-28-01';
const RAW_PRIMARY_ID = '550e8400-e29b-41d4-a716-446655440000';
const REVIEW_PATH = buildAppJournalReviewPath(FIXTURE_PRIMARY_ID);
const DETAIL_PATH = buildAppJournalDetailPath(RAW_PRIMARY_ID);

async function expectSingleMain(page: Page) {
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.getByRole('main')).toHaveCount(1);
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
}

async function expectReviewNavigation(page: Page, width: number) {
  const primaryNavigation = page.getByTestId('primary-navigation');

  if (width < 768) {
    await expect(primaryNavigation).toBeHidden();
    return;
  }

  await expect(primaryNavigation).toBeVisible();
  await expect(page.getByRole('link', { name: ko.nav.journal, exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  const height = page.viewportSize()?.height ?? 0;
  if (width < 1024 || width < height) {
    await expect(primaryNavigation).toHaveCSS('flex-direction', 'row');
  } else {
    await expect(primaryNavigation).toHaveCSS('flex-direction', 'column');
  }
}

test.describe('Retrospective adaptive presentation', () => {
  test('keeps Original Journal and Retrospective single-column on Phone and Tablet Portrait', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', 'responsive contract runs on Chromium');

    for (const viewport of [
      { width: 393, height: 852 },
      { width: 834, height: 1060 },
      { width: 1024, height: 1366 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(REVIEW_PATH);

      const workspace = page.getByTestId('retrospective-workspace');
      await expect(workspace).toBeVisible();
      await expect(
        page.getByRole('heading', { name: ko.app.journalReview.retrospective.originalHeading }),
      ).toBeVisible();
      await expect(page.getByTestId('retrospective-editor')).toBeVisible();
      await expect(workspace).toHaveCSS('display', 'flex');
      await expect(page.getByRole('main')).toHaveCSS('overflow-y', 'auto');
      await expectReviewNavigation(page, viewport.width);
      await expectSingleMain(page);
      await expectNoHorizontalOverflow(page);
    }
  });

  test('uses Original Journal | Retrospective two-pane only on Landscape and Desktop', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', 'responsive contract runs on Chromium');

    for (const viewport of [
      { width: 1194, height: 834 },
      { width: 1360, height: 880 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(REVIEW_PATH);

      const workspace = page.getByTestId('retrospective-workspace');
      await expect(workspace).toHaveCSS('display', 'grid');
      await expect(workspace.locator('.retrospective-original-pane')).toBeVisible();
      await expect(workspace.locator('.retrospective-editor-pane')).toBeVisible();
      await expect(page.getByTestId('adaptive-content-host')).toHaveCSS('max-width', 'none');
      await expect(page.getByRole('main')).toHaveCSS('overflow-y', 'hidden');
      await expect(workspace.locator('.retrospective-original-pane')).toHaveCSS(
        'overflow-y',
        'auto',
      );
      await expect(workspace.locator('.retrospective-editor-pane')).toHaveCSS('overflow-y', 'auto');
      await expectReviewNavigation(page, viewport.width);
      await expectSingleMain(page);
      await expectNoHorizontalOverflow(page);

      const paneOrder = await workspace
        .locator(':scope > section')
        .evaluateAll((sections) => sections.map((section) => section.className));
      expect(paneOrder[0]).toContain('retrospective-original-pane');
      expect(paneOrder[1]).toContain('retrospective-editor-pane');
    }
  });

  test('gives both wide panes an actual independent scroll range and reachable controls', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', 'responsive contract runs on Chromium');

    for (const viewport of [
      { width: 1194, height: 834 },
      { width: 1360, height: 880 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(REVIEW_PATH);

      const originalPane = page.locator('.retrospective-original-pane');
      const editorPane = page.locator('.retrospective-editor-pane');
      const outcomeToggle = editorPane.getByRole('button', { name: /결과 관찰/ });
      await outcomeToggle.click();
      await expect(outcomeToggle).toHaveAttribute('aria-expanded', 'true');

      await editorPane
        .getByRole('textbox', { name: ko.app.journalReview.retrospective.bodyLabel })
        .fill('복기 내용을 충분히 길게 남겨 실제 편집 pane의 스크롤 범위를 확인한다. '.repeat(24));
      await editorPane
        .getByRole('textbox', { name: ko.app.journalReview.retrospective.outcomeLabel })
        .fill('결과 관찰 내용을 충분히 길게 남겨 실제 스크롤 범위를 확인한다. '.repeat(18));
      await editorPane
        .getByRole('textbox', { name: ko.app.journalReview.retrospective.qualityLabel })
        .fill('판단 과정의 배움을 충분히 길게 남겨 결과와 분리된 영역을 확인한다. '.repeat(18));
      await editorPane
        .getByRole('textbox', { name: ko.app.journalReview.retrospective.nextCheckLabel })
        .fill('다음 확인 항목을 충분히 길게 남겨 저장 CTA까지 접근 가능한지 확인한다. '.repeat(12));

      const originalBefore = await originalPane.evaluate((pane) => ({
        clientHeight: pane.clientHeight,
        scrollHeight: pane.scrollHeight,
        scrollTop: pane.scrollTop,
      }));
      const editorBefore = await editorPane.evaluate((pane) => ({
        clientHeight: pane.clientHeight,
        scrollHeight: pane.scrollHeight,
        scrollTop: pane.scrollTop,
      }));
      expect(originalBefore.scrollTop).toBe(0);
      expect(originalBefore.scrollHeight).toBeGreaterThan(originalBefore.clientHeight);
      expect(editorBefore.scrollHeight).toBeGreaterThan(editorBefore.clientHeight);

      const originalMarker = originalPane.getByRole('heading', {
        name: ko.app.journalReview.investment.reflectionHeading,
      });
      const saveButton = editorPane.getByRole('button', {
        name: ko.app.journalReview.retrospective.save,
        exact: true,
      });

      const originalAfter = await originalPane.evaluate((pane) => {
        pane.scrollTop = pane.scrollHeight;
        return { scrollTop: pane.scrollTop, scrollHeight: pane.scrollHeight };
      });
      const originalMarkerReachable = await originalMarker.evaluate((node, paneSelector) => {
        const pane = node.closest(paneSelector);
        if (!pane) return false;
        const paneRect = pane.getBoundingClientRect();
        const markerRect = node.getBoundingClientRect();
        return markerRect.top >= paneRect.top && markerRect.bottom <= paneRect.bottom;
      }, '.retrospective-original-pane');

      const editorAfter = await editorPane.evaluate((pane) => {
        pane.scrollTop = pane.scrollHeight;
        return { scrollTop: pane.scrollTop, scrollHeight: pane.scrollHeight };
      });
      await saveButton.focus();
      const saveReachability = await saveButton.evaluate((node, paneSelector) => {
        const pane = node.closest(paneSelector);
        if (!pane) return { focused: false, reachable: false };
        const paneRect = pane.getBoundingClientRect();
        const buttonRect = node.getBoundingClientRect();
        return {
          focused: document.activeElement === node,
          reachable: buttonRect.top >= paneRect.top && buttonRect.bottom <= paneRect.bottom,
        };
      }, '.retrospective-editor-pane');

      expect(originalAfter.scrollTop).toBeGreaterThan(0);
      expect(editorAfter.scrollTop).toBeGreaterThan(0);
      expect(originalMarkerReachable).toBe(true);
      expect(saveReachability).toEqual({ focused: true, reachable: true });
      await expectSingleMain(page);
      await expectNoHorizontalOverflow(page);

      console.log(
        `[retrospective-scroll] ${viewport.width}x${viewport.height} ` +
          JSON.stringify({
            original: { ...originalBefore, scrollTopAfter: originalAfter.scrollTop },
            retrospective: { ...editorBefore, scrollTopAfter: editorAfter.scrollTop },
            originalMarkerReachable,
            saveReachability,
          }),
      );
    }
  });

  test('supports direct deep-link, refresh, and browser back without losing route ownership', async ({
    page,
  }) => {
    await page.goto(REVIEW_PATH);
    const reviewUrl = page.url();
    await expect(page.getByTestId('retrospective-editor')).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL(reviewUrl);
    await expect(page.getByTestId('retrospective-editor')).toBeVisible();
    await expect(page.getByTestId('decision-context-snapshot')).toBeVisible();
    await expectSingleMain(page);

    await page.goto(DETAIL_PATH);
    await expect(
      page.getByRole('link', { name: ko.app.journalDetail.navigation.review }),
    ).toHaveAttribute('href', buildAppJournalReviewPath(RAW_PRIMARY_ID));
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${REVIEW_PATH}$`));
    await page.goto(DETAIL_PATH);
    await expect(
      page.getByRole('heading', { name: ko.app.journalDetail.headerTitle }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: '반도체 기업 A' })).toBeVisible();
    await expectSingleMain(page);
  });

  for (const missing of [
    { label: 'unknown', path: buildAppJournalReviewPath('unknown-record-id') },
    { label: 'malformed', path: `${APP_ROUTE_PATHS.journalList}/%25E0%25A4%25A/review` },
  ]) {
    test(`keeps ${missing.label} Review targets in Not Found state`, async ({ page }) => {
      await page.goto(missing.path);
      await expect(
        page.getByRole('heading', { name: ko.app.journalReview.notFound.heading }),
      ).toBeVisible();
      await expect(page.getByTestId('retrospective-editor')).toHaveCount(0);
      await expectSingleMain(page);
    });
  }
});

test.describe('Retrospective local save lifecycle', () => {
  test('preserves fields through Save Error and reaches Saved on Retry', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', 'lifecycle runs on Chromium');
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(`${REVIEW_PATH}?fixture=save-error`);

    const body = page.getByRole('textbox', {
      name: ko.app.journalReview.retrospective.bodyLabel,
    });
    const outcomeToggle = page.getByRole('button', { name: /결과 관찰/ });
    const originalMemo =
      'HBM 수요 기대가 꺾이지 않았고, 외국인 누적 매수가 며칠째 이어지고 있어서 지켜보기로 했다.';

    await body.fill('원본을 바꾸지 않고 배움을 적는다.');
    await outcomeToggle.click();
    await page
      .getByRole('textbox', { name: ko.app.journalReview.retrospective.outcomeLabel })
      .fill('실적 발표는 예상에 부합했다.');
    await page
      .getByRole('textbox', { name: ko.app.journalReview.retrospective.qualityLabel })
      .fill('반대 근거를 더 먼저 확인해야 했다.');
    await page
      .getByRole('textbox', { name: ko.app.journalReview.retrospective.nextCheckLabel })
      .fill('다음에는 확인 시점을 먼저 정한다.');

    await page
      .getByRole('button', { name: ko.app.journalReview.retrospective.save, exact: true })
      .click();
    await expect(page.getByTestId('retrospective-save-error')).toBeVisible();
    await expect(body).toHaveValue('원본을 바꾸지 않고 배움을 적는다.');
    await expect(
      page.getByRole('textbox', { name: ko.app.journalReview.retrospective.outcomeLabel }),
    ).toHaveValue('실적 발표는 예상에 부합했다.');
    await expect(
      page.getByRole('textbox', { name: ko.app.journalReview.retrospective.qualityLabel }),
    ).toHaveValue('반대 근거를 더 먼저 확인해야 했다.');
    await expect(page.getByText('관심', { exact: true })).toBeVisible();
    await expect(page.getByText('확신', { exact: true })).toBeVisible();
    await expect(page.getByText(originalMemo, { exact: true })).toBeVisible();
    await expect(page.getByTestId('decision-context-snapshot')).toBeVisible();

    await page.getByRole('button', { name: ko.app.journalReview.retrospective.retry }).click();
    await expect(page.getByTestId('retrospective-saved')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: ko.app.journalReview.retrospective.savedHeading }),
    ).toBeVisible();
    await expect(
      page.getByText(ko.app.journalReview.retrospective.separateRecordNotice),
    ).toBeVisible();
    await expect(page.getByText('원본을 바꾸지 않고 배움을 적는다.')).toBeVisible();
    await expect(page.getByText('실적 발표는 예상에 부합했다.')).toBeVisible();
    await expect(page.getByText('반대 근거를 더 먼저 확인해야 했다.')).toBeVisible();
    await expect(page.getByText(originalMemo, { exact: true })).toBeVisible();
    await expect(page.getByText('관심', { exact: true })).toBeVisible();
    await expect(page.getByText('확신', { exact: true })).toBeVisible();
    await expect(page.getByTestId('decision-context-snapshot')).toBeVisible();
    await expect(page.getByTestId('retrospective-save-error')).toHaveCount(0);
    await expectSingleMain(page);
    await expectNoHorizontalOverflow(page);
  });
});
