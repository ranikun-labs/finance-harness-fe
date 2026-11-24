import { startReview } from './review-test-flow';
import { expect, test, type Page } from '@playwright/test';

import { APP_ROUTE_PATHS, AUTH_ROUTE_PATHS, buildAppJournalDetailPath } from '@/constants/routes';
import { ko } from '@/i18n/messages/ko';

const PRIMARY_ID = '550e8400-e29b-41d4-a716-446655440000';

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

    await startReview(page, question);
    await expect(
      page.getByRole('heading', { name: ko.app.ask.handoff.heading, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: new RegExp(ko.app.ask.handoff.investment.title) }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: new RegExp(ko.app.ask.handoff.study.title) }),
    ).toBeVisible();

    await page.getByRole('link', { name: new RegExp(ko.app.ask.handoff.investment.title) }).click();
    await expect(page).toHaveURL(AUTH_ROUTE_PATHS.entry);
    await expect(page.getByRole('button', { name: ko.auth.entry.providerAction })).toHaveCount(0);
    await expect(page).toHaveURL(AUTH_ROUTE_PATHS.entry);
    await expect(page.getByRole('status')).toContainText(ko.auth.entry.unavailable);
    await expect(
      page.getByRole('heading', { name: ko.auth.entry.investmentHeading }),
    ).toBeVisible();
  });

  test('Review handoff returns to the exact partial variant without a Journal history loop', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', 'handoff flow runs on Chromium');
    await page.setViewportSize({ width: 393, height: 852 });
    const question = '부분 검토를 다시 확인하기';
    await startReview(page, question);
    await page.evaluate(() => {
      const url = new URL(window.location.href);
      url.searchParams.set('fixture', 'partial');
      window.history.replaceState(window.history.state, '', url);
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(
      page.getByRole('heading', { name: ko.app.ask.structured.partialTitle }),
    ).toBeVisible();
    const reviewUrl = new URL(page.url()).pathname + new URL(page.url()).search;
    await page.getByRole('link', { name: new RegExp(ko.app.ask.handoff.study.title) }).click();
    await expect(page).toHaveURL(AUTH_ROUTE_PATHS.entry);
    await expect(page.getByRole('button', { name: ko.auth.entry.providerAction })).toHaveCount(0);
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
    await expect(page.getByRole('heading', { level: 2, name: '반도체 기업 A' })).toBeVisible();
    await expect(page.getByText(/HBM 수요와 외국인 수급/)).toBeVisible();
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

  test('places primary navigation by the width/orientation contract at the 1280 boundary', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', 'responsive contract runs on Chromium');

    const cases = [
      { width: 1280, height: 1366, placement: 'rail' },
      { width: 1279, height: 1366, placement: 'top' },
      { width: 1024, height: 1366, placement: 'top' },
      { width: 1024, height: 768, placement: 'rail' },
      { width: 1280, height: 800, placement: 'rail' },
    ] as const;

    for (const { width, height, placement } of cases) {
      await page.setViewportSize({ width, height });
      await page.goto(APP_ROUTE_PATHS.journalList);

      const navigation = page.getByTestId('primary-navigation');
      await expect(navigation).toBeVisible();
      const navBox = await navigation.boundingBox();
      expect(navBox, `${width}x${height}`).not.toBeNull();
      const direction = await navigation.evaluate((node) => getComputedStyle(node).flexDirection);
      if (placement === 'rail') {
        expect(navBox!.width, `${width}x${height} rail width`).toBe(224);
        expect(navBox!.x).toBe(0);
        expect(direction).toBe('column');
      } else {
        expect(navBox!.width, `${width}x${height} top width`).toBe(width);
        expect(navBox!.height, `${width}x${height} top height`).toBeLessThan(100);
        expect(direction).toBe('row');
      }
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
      await expect(page.getByRole('heading', { level: 2, name: '반도체 기업 A' })).toBeVisible();
      await expectSingleMain(page);
      await expectNoHorizontalOverflow(page);
    }
  });

  test('filters the loaded journal records without dropping subsequent pages', async ({ page }) => {
    const studyId = '7d444840-9dc0-11d1-b245-5ffdce74fad2';
    await page.route('**/finance/journals?*', (route) => {
      const cursor = new URL(route.request().url()).searchParams.get('cursor');
      return route.fulfill({
        json: cursor
          ? {
              items: [
                {
                  journalId: studyId,
                  type: 'study',
                  occurredAt: '2026-08-10T09:00:00.000',
                  timeZone: 'Asia/Seoul',
                  title: '후속 페이지 학습 노트',
                },
              ],
              nextCursor: null,
            }
          : {
              items: [
                {
                  journalId: PRIMARY_ID,
                  type: 'investment',
                  occurredAt: '2026-08-12T14:30:15.123',
                  timeZone: 'Asia/Seoul',
                  assetName: 'ETF',
                  action: 'interest',
                },
              ],
              nextCursor: 'next-page',
            },
      });
    });
    await page.goto(APP_ROUTE_PATHS.journalList);
    const filters = page.getByRole('group', { name: ko.app.journalList.filters.groupLabel });
    await filters.getByRole('button', { name: ko.app.journalList.filters.study }).click();
    await expect(page.getByText(ko.app.journalList.filteredPagePending)).toBeVisible();
    await expect(page.getByText(ko.app.journalList.emptyFilter.title)).toHaveCount(0);
    await page.getByRole('button', { name: ko.app.journalList.loadMore }).click();
    await expect(page.getByText('후속 페이지 학습 노트')).toBeVisible();
    await expect(page.getByText('ETF')).toHaveCount(0);
    await filters.getByRole('button', { name: ko.app.journalList.filters.all }).click();
    await expect(page.getByText('ETF')).toBeVisible();
  });

  test('offers sign-in for an unauthorized journal and returns to the list on cancel', async ({
    page,
  }) => {
    await page.route('**/finance/journals?*', (route) => route.fulfill({ status: 401, json: {} }));
    await page.goto(APP_ROUTE_PATHS.journalList);

    await expect(page.getByText(ko.app.journalList.signInRequired.title)).toBeVisible();
    await expect(page.getByText(ko.app.journalList.emptyAll.title)).toHaveCount(0);
    await page.getByRole('link', { name: ko.app.journalList.signInRequired.action }).click();
    await expect(page).toHaveURL(AUTH_ROUTE_PATHS.entry);
    await expect(page.getByText(ko.auth.entry.unavailable, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: ko.app.journalNew.backToJournal }).click();
    await expect(page).toHaveURL(APP_ROUTE_PATHS.journalList);
    await expect(page.getByText(ko.app.journalList.signInRequired.title)).toBeVisible();
  });

  test('keeps the desktop selection pane neutral on list failure and restores it after retry', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', 'desktop workspace contract');
    await page.setViewportSize({ width: 1360, height: 880 });
    let attempts = 0;
    await page.route('**/finance/journals?*', async (route) => {
      attempts += 1;
      if (attempts === 1) {
        await route.fulfill({ status: 503, json: {} });
      } else {
        await route.fulfill({
          status: 200,
          json: {
            items: [
              {
                journalId: PRIMARY_ID,
                type: 'investment',
                occurredAt: '2026-08-12T14:30:15.123',
                timeZone: 'Asia/Seoul',
                assetName: 'ETF',
                action: 'interest',
              },
            ],
            nextCursor: null,
          },
        });
      }
    });
    await page.goto(APP_ROUTE_PATHS.journalList);
    const prompt = page.getByRole('heading', {
      name: ko.app.journalWorkspace.detailPrompt.heading,
    });
    await expect(page.getByText(ko.app.journalList.error.title)).toBeVisible();
    await expect(prompt).toHaveCount(0);
    await page.getByRole('button', { name: ko.app.journalList.error.retry }).click();
    await expect(page.getByText('ETF', { exact: true })).toBeVisible();
    await expect(prompt).toBeVisible();
  });

  test('keeps Journal New a single route surface and carries the Review context seam', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', 'responsive contract runs on Chromium');
    await page.setViewportSize({ width: 393, height: 852 });
    await startReview(page, 'context handoff');
    await page.getByRole('link', { name: ko.app.ask.handoff.investment.title }).click();
    await expect(page).toHaveURL(AUTH_ROUTE_PATHS.entry);
    await expect(page.getByRole('button', { name: ko.auth.entry.providerAction })).toHaveCount(0);
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
});
