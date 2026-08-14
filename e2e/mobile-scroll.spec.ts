import { expect, test } from '@playwright/test';

import {
  APP_ROUTE_PATHS,
  buildAppAskPath,
  buildAppJournalDetailPath,
  buildAppJournalNewPath,
  buildAppJournalReviewPath,
  buildFeaturesPath,
  buildLearnPath,
  buildLocaleHomePath,
} from '@/constants/routes';
import { en } from '@/i18n/messages/en';
import { ko } from '@/i18n/messages/ko';

test.describe('480×812 통합 뷰포트', () => {
  // eslint-disable-next-line no-empty-pattern
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', '중복 없이 480×812를 한 번 검증한다');
  });

  test('STEP 9 app/public 화면은 수평 overflow 없이 하나의 h1을 유지한다', async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 812 });

    const paths = [
      APP_ROUTE_PATHS.appHome,
      APP_ROUTE_PATHS.onboarding,
      buildAppAskPath('480px 통합 확인 질문'),
      APP_ROUTE_PATHS.journalList,
      buildAppJournalDetailPath('journal-2026-06-28-01'),
      buildAppJournalReviewPath('journal-2026-06-28-01'),
      buildAppJournalNewPath('investment'),
      buildAppJournalNewPath('study'),
      buildLocaleHomePath('ko'),
      buildLocaleHomePath('en'),
      buildFeaturesPath('ko'),
      buildFeaturesPath('en'),
      buildLearnPath('ko'),
      buildLearnPath('en'),
      '/fr',
      '/app/unknown',
    ];

    for (const path of paths) {
      await page.goto(path);
      await expect(page.locator('h1')).toHaveCount(1);
      const viewportContract = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        horizontalOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
      }));
      expect(viewportContract).toEqual({ width: 480, horizontalOverflow: false });
    }
  });
});

test.describe('모바일 세로 스크롤 계약', () => {
  // Playwright는 첫 인자가 fixture 구조분해 패턴이어야 하므로, 사용하지 않더라도
  // 빈 패턴 자체는 필요하다.
  // eslint-disable-next-line no-empty-pattern
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile 375', '375×812 뷰포트에서만 검증한다');
  });

  test('탭 화면(TabLayout)은 main만 스크롤하고 탭바는 viewport 하단에 유지된다', async ({
    page,
  }) => {
    await page.goto(APP_ROUTE_PATHS.appHome);
    await page.evaluate(() => {
      const tall = document.createElement('div');
      tall.style.height = '3000px';
      document.querySelector('main')?.appendChild(tall);
    });

    const viewportHeight = page.viewportSize()!.height;

    // 앱 프레임 밖 document는 콘텐츠 길이만큼 늘어나지 않는다.
    const docScrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(docScrollHeight).toBeLessThanOrEqual(viewportHeight + 1);

    // main만 실제로 스크롤 가능해야 한다.
    const mainScrollable = await page.evaluate(() => {
      const main = document.querySelector('main')!;
      return main.scrollHeight > main.clientHeight;
    });
    expect(mainScrollable).toBe(true);

    // main의 조상 중 main 자신을 제외하고, 실제 스크롤 표면(overflow-y: auto/scroll)이면서
    // 넘치는(이중 스크롤) 컨테이너가 없어야 한다. overflow:visible인 조상은 scrollHeight가
    // clientHeight보다 커도 실제 스크롤바를 만들지 않으므로 제외한다.
    const overflowingAncestors = await page.evaluate(() => {
      const main = document.querySelector('main')!;
      let el: HTMLElement | null = main.parentElement;
      let count = 0;
      while (el) {
        const overflowY = getComputedStyle(el).overflowY;
        const isScrollSurface = overflowY === 'auto' || overflowY === 'scroll';
        if (isScrollSurface && el.scrollHeight > el.clientHeight + 1) count += 1;
        el = el.parentElement;
      }
      return count;
    });
    expect(overflowingAncestors).toBe(0);

    // main이 실제로 스크롤된다.
    await page.evaluate(() => {
      document.querySelector('main')!.scrollTop = 500;
    });
    const scrollTop = await page.evaluate(() => document.querySelector('main')!.scrollTop);
    expect(scrollTop).toBeGreaterThan(0);

    // 탭바는 viewport 하단 범위 안에 유지되고, 본문 콘텐츠를 가리지 않는다.
    const nav = page.getByRole('navigation', { name: '주요 화면 이동' });
    const navBox = (await nav.boundingBox())!;
    expect(navBox.y + navBox.height).toBeLessThanOrEqual(viewportHeight + 1);

    const mainBox = (await page.locator('main').boundingBox())!;
    expect(mainBox.y + mainBox.height).toBeLessThanOrEqual(navBox.y + 1);
  });

  test('탭 없는 화면은 AppShell 콘텐츠 영역만 스크롤한다', async ({ page }) => {
    await page.goto(APP_ROUTE_PATHS.onboarding);
    await page.evaluate(() => {
      const tall = document.createElement('div');
      // PageSkeleton 루트가 flex-col이라 기본 flex-shrink(1)에 눌리지 않도록 고정한다.
      tall.style.height = '3000px';
      tall.style.flexShrink = '0';
      document.querySelector('h1')?.parentElement?.appendChild(tall);
    });

    const viewportHeight = page.viewportSize()!.height;

    const docScrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(docScrollHeight).toBeLessThanOrEqual(viewportHeight + 1);

    // h1의 조상 중 실제 스크롤 표면(overflow-y: auto/scroll)이면서 넘치는 컨테이너는
    // 정확히 하나(AppShell 프레임)여야 한다. overflow:visible인 PageSkeleton 루트는
    // scrollHeight가 clientHeight보다 커도 실제 스크롤바를 만들지 않으므로 제외한다.
    const scrollableAncestorCount = await page.evaluate(() => {
      const h1 = document.querySelector('h1')!;
      let el: HTMLElement | null = h1.parentElement;
      let count = 0;
      while (el) {
        const overflowY = getComputedStyle(el).overflowY;
        const isScrollSurface = overflowY === 'auto' || overflowY === 'scroll';
        if (isScrollSurface && el.scrollHeight > el.clientHeight + 1) count += 1;
        el = el.parentElement;
      }
      return count;
    });
    expect(scrollableAncestorCount).toBe(1);

    // 긴 실제 온보딩 콘텐츠의 끝까지 AppShell만 스크롤하며 CTA에 도달할 수 있어야 한다.
    const cta = page.getByRole('link', { name: '동의하고 시작하기' });
    await cta.scrollIntoViewIfNeeded();
    await expect(cta).toBeVisible();
  });

  test('Ask Result는 main만 스크롤하고 phone primary navigation을 노출하지 않는다', async ({
    page,
  }) => {
    await page.goto(buildAppAskPath('모바일 스크롤 표면과 마지막 CTA 노출을 확인하는 질문'));

    const viewportHeight = page.viewportSize()!.height;
    const scrollContract = await page.evaluate(() => {
      const main = document.querySelector('main')!;
      let el: HTMLElement | null = main.parentElement;
      let overflowingAncestorCount = 0;
      while (el) {
        const overflowY = getComputedStyle(el).overflowY;
        const isScrollSurface = overflowY === 'auto' || overflowY === 'scroll';
        if (isScrollSurface && el.scrollHeight > el.clientHeight + 1) {
          overflowingAncestorCount += 1;
        }
        el = el.parentElement;
      }
      return {
        documentHeight: document.documentElement.scrollHeight,
        mainScrollable: main.scrollHeight > main.clientHeight,
        overflowingAncestorCount,
      };
    });

    expect(scrollContract.documentHeight).toBeLessThanOrEqual(viewportHeight + 1);
    expect(scrollContract.mainScrollable).toBe(true);
    expect(scrollContract.overflowingAncestorCount).toBe(0);

    const lastCta = page.getByRole('link', { name: ko.app.ask.handoff.investment.title });
    await lastCta.scrollIntoViewIfNeeded();
    const ctaBox = (await lastCta.boundingBox())!;
    await expect(page.getByRole('navigation', { name: ko.nav.ariaLabel })).toHaveCount(0);
    expect(ctaBox.y + ctaBox.height).toBeLessThanOrEqual(viewportHeight + 1);
  });

  for (const { label, question } of [
    { label: '긴 한국어', question: '산업 흐름과 실적 전제를 어떻게 확인해야 할까요? '.repeat(12) },
    {
      label: 'long English',
      question: 'How should I review business context and earnings assumptions? '.repeat(12),
    },
    { label: '긴 무공백', question: 'A'.repeat(320) },
  ]) {
    test(`Ask Result의 ${label} 질문은 수평 overflow 없이 wrap된다`, async ({ page }) => {
      await page.goto(buildAppAskPath(question));
      const questionText = page.getByText(question.trim());
      await expect(questionText).toBeVisible();

      const overflow = await page.evaluate(() => {
        const main = document.querySelector('main')!;
        return {
          document: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          main: main.scrollWidth > main.clientWidth,
        };
      });
      expect(overflow).toEqual({ document: false, main: false });
    });
  }
});

test.describe('Home 모바일 레이아웃', () => {
  // eslint-disable-next-line no-empty-pattern
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile 375', '375×812 뷰포트에서만 검증한다');
  });

  test('Hero가 첫 화면에 보이고 main만 스크롤하며 마지막 링크가 탭바에 가리지 않는다', async ({
    page,
  }) => {
    await page.goto(APP_ROUTE_PATHS.appHome);

    const viewportHeight = page.viewportSize()!.height;
    const questionInput = page.getByRole('textbox', { name: ko.app.home.question.label });
    const questionBox = (await questionInput.boundingBox())!;
    expect(questionBox.y).toBeGreaterThanOrEqual(0);
    expect(questionBox.y).toBeLessThan(viewportHeight);

    const contract = await page.evaluate(() => {
      const main = document.querySelector('main')!;
      let element: HTMLElement | null = main;
      let overflowingScrollSurfaces = 0;
      while (element) {
        const overflowY = getComputedStyle(element).overflowY;
        const isScrollSurface = overflowY === 'auto' || overflowY === 'scroll';
        if (isScrollSurface && element.scrollHeight > element.clientHeight + 1) {
          overflowingScrollSurfaces += 1;
        }
        element = element.parentElement;
      }
      return {
        documentHeight: document.documentElement.scrollHeight,
        mainScrollable: main.scrollHeight > main.clientHeight,
        overflowingScrollSurfaces,
        horizontalOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });

    expect(contract.documentHeight).toBeLessThanOrEqual(viewportHeight + 1);
    expect(contract.mainScrollable).toBe(true);
    // Canonical Raw Detail is intentionally smaller than the old fixture-heavy surface for
    // some records; when it fits, zero overflowing surfaces is correct. It must never create
    // more than the single approved AppShell scroll owner.
    expect(contract.overflowingScrollSurfaces).toBeLessThanOrEqual(1);
    expect(contract.horizontalOverflow).toBe(false);

    const viewAll = page.getByRole('link', { name: ko.app.home.recentRecords.viewAll });
    await viewAll.scrollIntoViewIfNeeded();
    const viewAllBox = (await viewAll.boundingBox())!;
    const navBox = (await page.getByRole('navigation', { name: ko.nav.ariaLabel }).boundingBox())!;
    expect(viewAllBox.y).toBeGreaterThanOrEqual(0);
    expect(viewAllBox.y + viewAllBox.height).toBeLessThanOrEqual(navBox.y + 1);
  });

  test('긴 Hero와 최근 기록 문구도 수평 overflow 없이 wrap된다', async ({ page }) => {
    await page.goto(APP_ROUTE_PATHS.appHome);

    await page
      .getByRole('heading', { level: 1, name: ko.app.home.hero.heading })
      .evaluate((element) => {
        element.textContent = 'H'.repeat(360);
      });
    await page.getByText('반도체 기업 A 요즘 어때?').evaluate((element) => {
      element.textContent = 'Q'.repeat(360);
    });

    const overflow = await page.evaluate(() => {
      const main = document.querySelector('main')!;
      return {
        document: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        main: main.scrollWidth > main.clientWidth,
      };
    });
    expect(overflow).toEqual({ document: false, main: false });
  });
});

test.describe('Adaptive app shell', () => {
  // eslint-disable-next-line no-empty-pattern
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', '데스크톱 프로젝트에서만 검증한다');
  });

  test('separates adaptive host width from readable content width', async ({ page }) => {
    for (const contract of [
      { width: 393, height: 852, contentWidth: 393, navPlacement: 'bottom' },
      { width: 834, height: 1060, contentWidth: 660, navPlacement: 'top' },
      { width: 1024, height: 1366, contentWidth: 660, navPlacement: 'top' },
      { width: 1194, height: 834, contentWidth: 660, navPlacement: 'rail' },
      { width: 1360, height: 880, contentWidth: 660, navPlacement: 'rail' },
    ] as const) {
      await page.setViewportSize({ width: contract.width, height: contract.height });
      await page.goto(APP_ROUTE_PATHS.appHome);

      const host = page.getByTestId('app-shell-host');
      const content = page.getByTestId('adaptive-content-host');
      const navigation = page.getByRole('navigation', { name: ko.nav.ariaLabel });
      const hostBox = (await host.boundingBox())!;
      const contentBox = (await content.boundingBox())!;
      const navBox = (await navigation.boundingBox())!;

      expect(hostBox.width).toBe(contract.width);
      expect(contentBox.width).toBe(contract.contentWidth);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      ).toBe(true);
      if (contract.navPlacement === 'bottom') {
        expect(navBox.width).toBe(contract.width);
        expect(navBox.y + navBox.height).toBe(contract.height);
      } else if (contract.navPlacement === 'top') {
        expect(navBox.width).toBe(contract.width);
        expect(navBox.height).toBeLessThan(100);
      } else {
        expect(navBox.width).toBe(224);
        expect(navBox.height).toBe(contract.height);
      }
    }
  });

  test('keeps adaptive primary navigation on internal journal routes', async ({ page }) => {
    const journalRoutes = [
      buildAppJournalNewPath('investment'),
      buildAppJournalDetailPath('journal-2026-06-28-01'),
      buildAppJournalReviewPath('journal-2026-06-28-01'),
    ];
    const viewports = [
      { width: 393, height: 852, phone: true },
      { width: 834, height: 1060, phone: false },
      { width: 1024, height: 1366, phone: false },
      { width: 1194, height: 834, phone: false },
      { width: 1360, height: 880, phone: false },
    ] as const;

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      for (const route of journalRoutes) {
        await page.goto(route);

        const navigation = page.getByRole('navigation', { name: ko.nav.ariaLabel });
        if (viewport.phone) {
          await expect(navigation).toBeHidden();
        } else {
          await expect(navigation).toBeVisible();
          await expect(page.getByRole('link', { name: ko.nav.journal })).toHaveAttribute(
            'aria-current',
            'page',
          );
        }

        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
          ),
        ).toBe(true);
      }
    }
  });

  test('keeps Review Result readable surface wider than general surfaces', async ({ page }) => {
    for (const viewport of [
      { width: 834, height: 1060 },
      { width: 1024, height: 1366 },
      { width: 1194, height: 834 },
      { width: 1360, height: 880 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(buildAppAskPath('adaptive readable result width'));

      const hostBox = (await page.getByTestId('app-shell-host').boundingBox())!;
      const contentBox = (await page.getByTestId('adaptive-content-host').boundingBox())!;
      expect(hostBox.width).toBe(viewport.width);
      expect(contentBox.width).toBe(760);
    }
  });
});

test.describe('Ask 영어 모바일 레이아웃', () => {
  test.use({ locale: 'en-US' });

  // eslint-disable-next-line no-empty-pattern
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile 375', '375×812 뷰포트에서만 검증한다');
  });

  test('영어 CTA와 fixture가 375px에서 수평 overflow를 만들지 않는다', async ({ page }) => {
    await page.goto(buildAppAskPath('How should I review this question?'));

    await expect(page.getByRole('note')).toHaveText(en.app.ask.structured.provenance);
    await expect(
      page.getByRole('link', { name: en.app.ask.handoff.investment.title }),
    ).toBeVisible();
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});

test.describe('기록 상세 모바일 레이아웃', () => {
  const PRIMARY_INVESTMENT_ID = 'journal-2026-06-28-01';

  // eslint-disable-next-line no-empty-pattern
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile 375', '375×812 뷰포트에서만 검증한다');
  });

  test('AppShell만 스크롤하고 마지막 복기 CTA가 완전히 노출된다', async ({ page }) => {
    await page.goto(buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID));

    const viewportHeight = page.viewportSize()!.height;
    const contract = await page.evaluate(() => {
      const main = document.querySelector('main')!;
      let element: HTMLElement | null = main;
      let overflowingScrollSurfaces = 0;
      while (element) {
        const overflowY = getComputedStyle(element).overflowY;
        const isScrollSurface = overflowY === 'auto' || overflowY === 'scroll';
        if (isScrollSurface && element.scrollHeight > element.clientHeight + 1) {
          overflowingScrollSurfaces += 1;
        }
        element = element.parentElement;
      }
      return {
        documentHeight: document.documentElement.scrollHeight,
        overflowingScrollSurfaces,
        horizontalOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });

    expect(contract.documentHeight).toBeLessThanOrEqual(viewportHeight + 1);
    // A canonical summary/detail payload may fit within the viewport; zero
    // overflowing surfaces is valid when the AppShell has nothing to scroll.
    expect(contract.overflowingScrollSurfaces).toBeLessThanOrEqual(1);
    expect(contract.horizontalOverflow).toBe(false);
    await expect(page.getByRole('navigation', { name: ko.nav.ariaLabel })).toHaveCount(0);

    const reviewCta = page.getByRole('link', {
      name: ko.app.journalDetail.navigation.review,
    });
    await reviewCta.scrollIntoViewIfNeeded();
    const ctaBox = (await reviewCta.boundingBox())!;
    expect(ctaBox.y).toBeGreaterThanOrEqual(0);
    expect(ctaBox.y + ctaBox.height).toBeLessThanOrEqual(viewportHeight + 1);
  });

  test('긴 무공백 기록도 수평 overflow 없이 wrap된다', async ({ page }) => {
    await page.goto(buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID));

    const recordHeading = page.getByRole('heading', {
      name: ko.app.journalDetail.investment.reasoningHeading,
    });
    const recordText = recordHeading.locator('xpath=..').locator('p');
    await recordText.evaluate((element) => {
      element.textContent = 'A'.repeat(360);
    });

    const overflow = await page.evaluate(() => {
      const main = document.querySelector('main')!;
      return {
        document: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        main: main.scrollWidth > main.clientWidth,
      };
    });
    expect(overflow).toEqual({ document: false, main: false });
    await expect(recordText).toBeVisible();
  });
});

test.describe('기록 복기 모바일 레이아웃', () => {
  const PRIMARY_INVESTMENT_ID = 'journal-2026-06-28-01';

  // eslint-disable-next-line no-empty-pattern
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile 375', '375×812 뷰포트에서만 검증한다');
  });

  test('AppShell만 스크롤하고 마지막 상세 복귀 CTA가 완전히 노출된다', async ({ page }) => {
    await page.goto(buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID));

    const viewportHeight = page.viewportSize()!.height;
    const contract = await page.evaluate(() => {
      const main = document.querySelector('main')!;
      let element: HTMLElement | null = main;
      let overflowingScrollSurfaces = 0;
      while (element) {
        const overflowY = getComputedStyle(element).overflowY;
        const isScrollSurface = overflowY === 'auto' || overflowY === 'scroll';
        if (isScrollSurface && element.scrollHeight > element.clientHeight + 1) {
          overflowingScrollSurfaces += 1;
        }
        element = element.parentElement;
      }
      return {
        documentHeight: document.documentElement.scrollHeight,
        overflowingScrollSurfaces,
        horizontalOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });

    expect(contract.documentHeight).toBeLessThanOrEqual(viewportHeight + 1);
    expect(contract.overflowingScrollSurfaces).toBe(1);
    expect(contract.horizontalOverflow).toBe(false);
    await expect(page.getByRole('navigation', { name: ko.nav.ariaLabel })).toHaveCount(0);

    const detailCta = page
      .getByRole('link', { name: ko.app.journalReview.navigation.detail })
      .last();
    await detailCta.scrollIntoViewIfNeeded();
    const ctaBox = (await detailCta.boundingBox())!;
    expect(ctaBox.y).toBeGreaterThanOrEqual(0);
    expect(ctaBox.y + ctaBox.height).toBeLessThanOrEqual(viewportHeight + 1);
  });

  test('긴 무공백 질문과 메모도 수평 overflow 없이 wrap된다', async ({ page }) => {
    await page.goto(buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID));

    const questionSection = page
      .getByRole('heading', {
        name: ko.app.journalReview.investment.questionHeading,
      })
      .locator('xpath=..');
    const memoSection = page
      .getByRole('heading', {
        name: ko.app.journalReview.investment.memoHeading,
      })
      .locator('xpath=..');
    await questionSection.locator('p').evaluate((element) => {
      element.textContent = 'Q'.repeat(360);
    });
    await memoSection.locator('p').evaluate((element) => {
      element.textContent = 'M'.repeat(360);
    });

    const overflow = await page.evaluate(() => {
      const main = document.querySelector('main')!;
      return {
        document: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        main: main.scrollWidth > main.clientWidth,
      };
    });
    expect(overflow).toEqual({ document: false, main: false });
  });
});
