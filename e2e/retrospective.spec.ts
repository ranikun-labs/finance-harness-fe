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

test('opens a server-supplied original from journal detail and after reload', async ({ page }) => {
  const journalId = '19408084-cd43-4edd-aebc-9578935dc2ea';
  const summary = {
    journalId,
    type: 'investment',
    occurredAt: '2026-08-12T14:30:15.123',
    timeZone: 'Asia/Seoul',
    assetName: '서버에서 읽은 원본 기록',
    action: 'interest',
  };
  const detail = {
    ...summary,
    createdAt: '2026-08-12T05:31:02.123Z',
    updatedAt: '2026-08-12T05:31:02.123Z',
    reasoning: '순서를 지켜서 원본을 확인했어요.',
    emotion: null,
    revision: 1,
  };
  await page.route('**/finance/journals?*', (route) =>
    route.fulfill({ json: { items: [summary], nextCursor: null } }),
  );
  let detailRequests = 0;
  await page.route(`**/finance/journals/${journalId}`, (route) => {
    detailRequests += 1;
    return route.fulfill({ json: detail });
  });
  await page.goto(buildAppJournalDetailPath(journalId));
  await page.getByRole('link', { name: ko.app.journalDetail.navigation.review }).click();
  await expect(page.getByRole('heading', { name: detail.assetName })).toBeVisible();
  const original = page.locator('.retrospective-original-details');
  if ((page.viewportSize()?.width ?? 0) < 1024) {
    await expect(original).not.toHaveAttribute('open');
    await original.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(original).toHaveAttribute('open');
    await page.setViewportSize({ width: 1194, height: 834 });
    await expect(original).toHaveAttribute('open');
    await original.locator('summary').click();
    await expect(original).not.toHaveAttribute('open');
    await page.setViewportSize({ width: 834, height: 1194 });
    await expect(original).not.toHaveAttribute('open');
  }
  if (!(await original.evaluate((element: HTMLDetailsElement) => element.open))) {
    await original.locator('summary').click();
  }
  // 접힌 폰에서는 두 줄 미리보기와 펼친 본문에 같은 문장이 있다. 펼치는 순간 미리보기가 사라지기 전까지
  // 둘이 함께 있어(strict mode 위반) 간헐 실패했으므로, 확인 대상을 펼쳐진 원본 본문으로 한정한다.
  await expect(original).toHaveAttribute('open');
  await expect(original.getByText(detail.reasoning)).toBeVisible();
  if (process.env.VITE_FINANCE_RETROSPECTIVE_ENABLED !== 'true') {
    await expect(page.getByText(ko.app.journalReview.saveUnavailable)).toBeVisible();
  }
  await expect(page.getByTestId('retrospective-editor')).toHaveCount(0);
  expect(detailRequests).toBe(2);

  await page.reload();
  if (!(await original.evaluate((element: HTMLDetailsElement) => element.open))) {
    await original.locator('summary').click();
  }
  // 접힌 폰에서는 두 줄 미리보기와 펼친 본문에 같은 문장이 있다. 펼치는 순간 미리보기가 사라지기 전까지
  // 둘이 함께 있어(strict mode 위반) 간헐 실패했으므로, 확인 대상을 펼쳐진 원본 본문으로 한정한다.
  await expect(original).toHaveAttribute('open');
  await expect(original.getByText(detail.reasoning)).toBeVisible();
  expect(detailRequests).toBe(3);
});

test('preserves a saved retrospective draft while opening the original across rotation', async ({
  page,
}) => {
  test.skip(
    process.env.VITE_FINANCE_RETROSPECTIVE_ENABLED !== 'true',
    'requires the saved retrospective feature flag',
  );
  const journalId = '19408084-cd43-4edd-aebc-9578935dc2ea';
  await page.route(`**/finance/journals/${journalId}`, (route) =>
    route.fulfill({
      json: {
        journalId,
        type: 'investment',
        occurredAt: '2026-08-12T14:30:15.123',
        timeZone: 'Asia/Seoul',
        createdAt: '2026-08-12T05:31:02.123Z',
        updatedAt: '2026-08-12T05:31:02.123Z',
        assetName: '원본 기록 대상',
        action: 'interest',
        reasoning: '원래 판단의 이유',
        emotion: null,
        revision: 1,
      },
    }),
  );
  await page.route(`**/finance/journals/${journalId}/retrospectives`, (route) =>
    route.fulfill({ json: { items: [], hasMore: false } }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(buildAppJournalReviewPath(journalId));
  const field = page.getByLabel('지금 다시 보면, 무엇이 달라졌나요? *');
  await field.fill('작성 중인 복기');
  const optional = page.getByText('결과와 판단 과정 돌아보기 (선택)');
  await optional.focus();
  await page.keyboard.press('Enter');
  await page.getByLabel('결과 관찰').fill('관찰');
  await optional.focus();
  await page.keyboard.press('Enter');
  await optional.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('결과 관찰')).toHaveValue('관찰');
  const preview = page.locator('.retrospective-original-pane > div p.line-clamp-2');
  await expect(preview).toHaveText('원래 판단의 이유');
  await expect(preview).toBeVisible();
  const original = page.locator('.retrospective-original-details');
  await original.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(original).toHaveAttribute('open');
  await expect(preview).toHaveCount(0);
  await page.setViewportSize({ width: 1194, height: 834 });
  await expect(original).toHaveAttribute('open');
  await expect(field).toHaveValue('작성 중인 복기');
  await original.locator('summary').click();
  await page.setViewportSize({ width: 834, height: 1194 });
  await expect(original).not.toHaveAttribute('open');
  await expect(field).toHaveValue('작성 중인 복기');
  let confirmations = 0;
  page.on('dialog', async (dialog) => {
    confirmations += 1;
    await dialog.dismiss();
  });
  await page.getByRole('link', { name: ko.app.journalReview.backLabel }).first().click();
  expect(confirmations).toBe(1);
  await expect(field).toHaveValue('작성 중인 복기');
  await page.getByRole('link', { name: ko.app.journalReview.backLabel }).last().click();
  expect(confirmations).toBe(2);
  await expect(field).toHaveValue('작성 중인 복기');
});

test('wraps long saved retrospective fields on a phone', async ({ page }) => {
  test.skip(
    process.env.VITE_FINANCE_RETROSPECTIVE_ENABLED !== 'true',
    'requires the saved retrospective feature flag',
  );
  const journalId = '19408084-cd43-4edd-aebc-9578935dc2ea';
  await page.route(`**/finance/journals/${journalId}`, (route) =>
    route.fulfill({
      json: {
        journalId,
        type: 'investment',
        occurredAt: '2026-08-12T14:30:15.123',
        timeZone: 'Asia/Seoul',
        createdAt: '2026-08-12T05:31:02.123Z',
        updatedAt: '2026-08-12T05:31:02.123Z',
        assetName: '원본 기록 대상',
        action: 'interest',
        reasoning: '원래 판단의 이유',
        emotion: null,
        revision: 1,
      },
    }),
  );
  const longText = 'unbroken'.repeat(100);
  await page.route(`**/finance/journals/${journalId}/retrospectives`, (route) =>
    route.fulfill({
      json: {
        items: [
          {
            retrospectiveId: 'r1',
            journalId,
            sourceRevision: 1,
            createdAt: '2026-11-20T00:00:00Z',
            body: 'Reflection',
            outcomeObservation: longText,
            decisionQuality: longText,
            nextCheck: longText,
          },
        ],
        hasMore: false,
      },
    }),
  );
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto(buildAppJournalReviewPath(journalId));
  const article = page.getByRole('article');
  await expect(article).toBeVisible();
  expect(await article.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
    true,
  );
  await expectNoHorizontalOverflow(page);
});

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

  test('aligns both pane heads on one baseline over the same ground in Light and Dark', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', 'responsive contract runs on Chromium');

    for (const scheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      for (const viewport of [
        { width: 1194, height: 834 },
        { width: 1280, height: 1366 },
      ]) {
        await page.setViewportSize(viewport);
        await page.goto(REVIEW_PATH);
        await page.evaluate(
          (dark) => document.documentElement.classList.toggle('dark', dark),
          scheme === 'dark',
        );

        const originalPane = page.locator('.retrospective-original-pane');
        const editorPane = page.locator('.retrospective-editor-pane');
        const originalTop = await originalPane
          .getByRole('heading', { name: ko.app.journalReview.retrospective.originalHeading })
          .evaluate((element) => element.getBoundingClientRect().top);
        const editorTop = await editorPane
          .getByRole('heading', { name: ko.app.journalReview.retrospective.editorHeading })
          .evaluate((element) => element.getBoundingClientRect().top);
        expect(Math.abs(originalTop - editorTop)).toBeLessThanOrEqual(1);

        const backgrounds = await page.evaluate(() =>
          ['.retrospective-original-pane', '.retrospective-editor-pane'].map(
            (selector) => getComputedStyle(document.querySelector(selector)!).backgroundColor,
          ),
        );
        expect(backgrounds[0]).toBe(backgrounds[1]);

        // 두 열 위의 머리는 뒤로 가기 옆 왼쪽: 제목이 두 열 가운데에 떠 있지 않다.
        const title = await page
          .getByRole('heading', { level: 1, name: ko.app.journalReview.headerTitle })
          .evaluate((element) => element.getBoundingClientRect().left);
        const mainLeft = await page
          .getByRole('main')
          .evaluate((element) => element.getBoundingClientRect().left);
        expect(title - mainLeft).toBeLessThan(120);
      }
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
