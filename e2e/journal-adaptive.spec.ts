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

  test('keeps the shell header to one row: phone inner screens fold it, tablet starts content high', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', 'responsive contract runs on Chromium');
    const appHeader = page.getByTestId('app-shell-host').locator('> header');
    const mainTop = async () => (await page.locator('main').boundingBox())!.y;

    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(APP_ROUTE_PATHS.journalList);
    await expect(appHeader).toBeVisible();

    for (const path of [buildAppJournalDetailPath(PRIMARY_ID), APP_ROUTE_PATHS.journalNew]) {
      await page.goto(path);
      await expect(page.locator('main')).toBeVisible();
      await expect(appHeader).toBeHidden();
      expect(await mainTop()).toBeLessThan(8);
    }

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(APP_ROUTE_PATHS.journalList);
    await expect(appHeader).toBeVisible();
    await expect(page.getByTestId('primary-navigation')).toBeVisible();
    expect(await mainTop()).toBeLessThanOrEqual(130);
    await page.goto(APP_ROUTE_PATHS.journalNew);
    await expect(appHeader).toBeVisible();
  });

  test('keeps the small "new record" action a 44px target inside the two-pane list', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', 'responsive contract runs on Chromium');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(APP_ROUTE_PATHS.journalList);
    const link = page.getByRole('link', { name: ko.app.journalList.newRecord });
    await expect(link).toBeVisible();
    const box = (await link.boundingBox())!;
    // 시각 박스(36) 바깥 ::after 확장 영역까지 실제로 같은 링크가 히트되는 높이를 잰다.
    const hit = await link.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const hits = (y: number) => {
        const t = document.elementFromPoint(x, y);
        return t === el || el.contains(t);
      };
      let top = r.top;
      let bottom = r.bottom;
      for (let d = 1; d <= 12 && hits(r.top - d + 0.5); d += 1) top = r.top - d;
      for (let d = 1; d <= 12 && hits(r.bottom + d - 0.5); d += 1) bottom = r.bottom + d;
      return bottom - top;
    });
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(hit).toBeGreaterThanOrEqual(44);
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

  test('hides the Detail back link only where the two-pane workspace is shown', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', 'responsive contract runs on Chromium');

    const cases = [
      { width: 393, height: 852, twoPane: false },
      { width: 768, height: 1024, twoPane: false },
      { width: 1023, height: 768, twoPane: false },
      { width: 1024, height: 768, twoPane: true },
      { width: 1024, height: 1366, twoPane: false },
      { width: 1279, height: 1366, twoPane: false },
      { width: 1280, height: 1366, twoPane: true },
      { width: 1440, height: 900, twoPane: true },
    ] as const;

    for (const { width, height, twoPane } of cases) {
      await page.setViewportSize({ width, height });
      await page.goto(buildAppJournalDetailPath(PRIMARY_ID));
      const label = `${width}x${height}`;
      await expect(page.getByRole('heading', { level: 2, name: '반도체 기업 A' })).toBeVisible();
      const back = page.getByRole('link', { name: ko.app.journalDetail.backLabel });
      if (twoPane) {
        await expect(back, label).toBeHidden();
        await expect(page.locator('.journal-workspace-list-pane')).toBeVisible();
      } else {
        await expect(back, label).toBeVisible();
      }
      // 제목(h1)은 2-pane에서도 접근성 트리에 남는다(시각적으로만 접힘).
      await expect(
        page.getByRole('heading', { level: 1, name: ko.app.journalDetail.headerTitle }),
        label,
      ).toHaveCount(1);
      // 판단 이유 → 복기 진입 순서, 원문 ISO 글자는 보이지 않는다.
      const reasoningBox = await page.getByText(/HBM 수요/).boundingBox();
      const reviewBox = await page
        .getByRole('link', { name: ko.app.journalDetail.navigation.review })
        .boundingBox();
      expect(reasoningBox!.y, label).toBeLessThan(reviewBox!.y);
      await expect(page.locator('main')).not.toContainText(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
      // 시간대 이름(IANA, 예: Asia/Seoul)은 화면에 보이지 않는다(F1-05 공통 AC 5).
      await expect(page.locator('main')).not.toContainText(/[A-Z][a-z]+\/[A-Z][A-Za-z_]+/);
      await expectNoHorizontalOverflow(page);
    }

    // 없음 상태는 제목이 곧 상태 안내라 2-pane에서도 보이고, 뒤로 가기만 숨는다.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(buildAppJournalDetailPath('00000000-0000-4000-8000-000000000000'));
    await expect(
      page.getByRole('heading', { level: 1, name: ko.app.journalDetail.notFound.heading }),
    ).toBeVisible();
    // 없음 안내 안의 "목록으로" 링크는 별도 행동이라 남는다. 숨는 것은 머리의 ← 링크뿐이다.
    await expect(page.locator('.journal-detail-back')).toBeHidden();
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
    // 선택 카드는 테두리·그림자 없이 page 대비 surface(Card)로만 구분한다.
    for (const title of [
      ko.app.journalNew.entryChoice.investment.title,
      ko.app.journalNew.entryChoice.study.title,
    ]) {
      const card = page.getByRole('link', { name: new RegExp(title) });
      await expect(card).toHaveCSS('border-top-width', '0px');
      await expect(card).toHaveCSS('box-shadow', 'none');
    }
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

test.describe('Review result side column (F1-G7)', () => {
  for (const [width, height, aside] of [
    [1279, 800, false],
    [1280, 800, true],
    [1280, 1366, true],
    [1440, 900, true],
  ] as const) {
    test(`${width}x${height}: hand-off ${aside ? 'moves to a side column' : 'stays at the end with a sticky bar'}`, async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== 'Desktop Chromium', 'viewport is set explicitly');
      await page.setViewportSize({ width, height });
      await startReview(page, '보조 열 배치 확인');

      const invest = page.getByRole('link', { name: ko.app.ask.handoff.investment.title });
      await expect(invest).toHaveCount(1);
      await expect(invest).toBeVisible();
      const asideBox = page.getByTestId('review-result-aside');
      if (aside) {
        await expect(asideBox).toBeVisible();
        const a = await asideBox.boundingBox();
        const h1 = await page.getByRole('heading', { level: 1 }).boundingBox();
        // 보조 열은 본문 오른쪽에 있고 폭 300이며 본문 폭은 줄어도 가로 넘침은 없다.
        expect(a!.width).toBeCloseTo(300, 0);
        expect(a!.x).toBeGreaterThan(h1!.x + h1!.width - 1);
        await expect(page.getByTestId('review-primary-action')).toHaveCSS('position', 'static');
      } else {
        await expect(asideBox).toHaveCount(0);
        await expect(page.getByTestId('review-primary-action')).toHaveCSS('position', 'sticky');
      }
      await expectNoHorizontalOverflow(page);
    });
  }
});
