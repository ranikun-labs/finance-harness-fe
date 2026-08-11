import { expect, test, type Page } from '@playwright/test';

import {
  APP_ROUTE_PATHS,
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
    await page.getByRole('link', { name: ko.app.ask.navigation.investmentRecord }).click();
    await expect(page).toHaveURL(buildAppJournalNewPath('investment'));
    await expect(page.getByTestId('decision-context-capture')).toBeVisible();
    await expect(page.getByTestId('primary-navigation')).toBeHidden();
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
});
