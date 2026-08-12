import { expect, test, type Page } from '@playwright/test';

import { BOTTOM_TABS } from '@/constants/navigation';
import {
  APP_ROUTE_PATHS,
  buildAppJournalDetailPath,
  buildAppJournalNewPath,
  buildAppJournalReviewPath,
  buildAppAskPath,
  buildFeaturesPath,
  buildLearnPath,
  buildLocaleHomePath,
} from '@/constants/routes';
import { en } from '@/i18n/messages/en';
import { ko } from '@/i18n/messages/ko';

const PRIMARY_INVESTMENT_ID = 'journal-2026-06-28-01';
const SECOND_INVESTMENT_ID = 'journal-2026-06-24-01';
const STUDY_ID = 'journal-2026-06-27-01';
const APP_NOT_FOUND = '페이지를 찾을 수 없어요';
const PUBLIC_NOT_FOUND = '공개 페이지를 찾을 수 없어요';

async function expectJournalPrimaryNavigation(page: Page) {
  const navigation = page.getByTestId('primary-navigation');
  if ((page.viewportSize()?.width ?? 0) < 768) {
    await expect(navigation).toBeHidden();
    return;
  }

  await expect(navigation).toBeVisible();
  await expect(page.getByRole('link', { name: ko.nav.journal, exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
}

const APP_SCREENS: Array<{ path: string; heading: string | RegExp }> = [
  { path: APP_ROUTE_PATHS.onboarding, heading: ko.app.onboarding.hero.title },
  { path: APP_ROUTE_PATHS.appHome, heading: ko.app.home.hero.heading },
  { path: buildAppAskPath(), heading: ko.app.ask.header.title },
  { path: APP_ROUTE_PATHS.journalList, heading: ko.app.journalList.title },
  { path: buildAppJournalNewPath('investment'), heading: ko.app.journalNew.investment },
  {
    path: buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID),
    heading: ko.app.journalDetail.headerTitle,
  },
  {
    path: buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID),
    heading: ko.app.journalReview.headerTitle,
  },
];

// STEP 7부터 공개 웹은 URL locale에 따라 실제로 다른 언어를 렌더한다 — ko/en이 더
// 이상 같은(한국어) heading을 공유하지 않는다.
const PUBLIC_SCREENS: Array<{ path: string; heading: RegExp }> = [
  { path: buildLocaleHomePath('ko'), heading: /공개 웹 홈/ },
  { path: buildLocaleHomePath('en'), heading: /Public Home/ },
  { path: buildFeaturesPath('ko'), heading: /기능 소개/ },
  { path: buildFeaturesPath('en'), heading: /Features/ },
  { path: buildLearnPath('ko', 'basics'), heading: /학습/ },
  { path: buildLearnPath('en', 'basics'), heading: /Learn/ },
];

test.describe('공개/앱 라우트 경계 스모크 테스트', () => {
  test('/ redirects to the default locale public home', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(new RegExp(`${buildLocaleHomePath('ko')}$`));
    await expect(page.getByRole('heading', { name: /공개 웹 홈/ })).toBeVisible();
  });

  for (const screen of PUBLIC_SCREENS) {
    test(`renders public ${screen.path}`, async ({ page }) => {
      await page.goto(screen.path);
      await expect(page.getByRole('heading', { name: screen.heading })).toBeVisible();
    });
  }

  for (const screen of APP_SCREENS) {
    test(`renders app ${screen.path}`, async ({ page }) => {
      await page.goto(screen.path);
      await expect(page.getByRole('heading', { name: screen.heading })).toBeVisible();
    });
  }

  test('journal app routes expose exactly one main landmark', async ({ page }) => {
    const landmarkRoutes = [
      APP_ROUTE_PATHS.journalList,
      buildAppJournalNewPath('investment'),
      buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID),
      buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID),
      buildAppJournalDetailPath('unknown-record-id'),
      buildAppJournalReviewPath('unknown-record-id'),
      `${APP_ROUTE_PATHS.journalList}/%25E0%25A4%25A`,
      `${APP_ROUTE_PATHS.journalList}/%25E0%25A4%25A/review`,
    ];

    for (const route of landmarkRoutes) {
      await page.goto(route);
      expect(await page.locator('main').count()).toBe(1);
      await expect(page.getByRole('main')).toHaveCount(1);
    }
  });

  test('renders public NotFound for an unsupported locale (no redirect)', async ({ page }) => {
    await page.goto('/fr');
    await expect(page).toHaveURL(/\/fr$/);
    await expect(page.getByRole('heading', { name: PUBLIC_NOT_FOUND })).toBeVisible();
  });

  test('renders app NotFound for an unknown /app sub-path', async ({ page }) => {
    await page.goto(`${APP_ROUTE_PATHS.appHome}/this-route-does-not-exist`);
    await expect(page.getByRole('heading', { name: APP_NOT_FOUND })).toBeVisible();
  });

  const LEGACY_PATHS = [
    '/onboarding',
    '/ask',
    '/journal',
    '/journal/new',
    '/journal/example',
    '/journal/example/review',
  ];

  for (const path of LEGACY_PATHS) {
    test(`legacy ${path} is not redirected and renders no app screen`, async ({ page }) => {
      await page.goto(path);
      // URL이 그대로 유지되고(= redirect 없음) 공개 NotFound가 렌더된다(= 앱 화면 아님).
      await expect(page).toHaveURL(new RegExp(`${path.replace(/[/]/g, '\\/')}$`));
      await expect(page.getByRole('heading', { name: PUBLIC_NOT_FOUND })).toBeVisible();
    });
  }

  test('bottom tabs navigate to the correct app routes', async ({ page }) => {
    await page.goto(APP_ROUTE_PATHS.appHome);

    for (const tab of BOTTOM_TABS) {
      // 앱 locale은 playwright.config.ts에서 'ko-KR'로 고정되므로(저장값 없음 →
      // navigator.language 폴백) ko 사전 값으로 매칭한다.
      await page.getByRole('link', { name: ko.nav[tab.id], exact: true }).click();
      const url = new URL(page.url());
      expect(url.pathname).toBe(tab.path);
    }
  });

  test('Review Start keeps the question and opens the Review Result flow', async ({ page }) => {
    await page.goto(APP_ROUTE_PATHS.appHome);

    const question = '실적 전망을 검토하고 싶어요';
    await page.getByRole('textbox', { name: ko.app.home.question.label }).fill(question);
    await page.getByRole('button', { name: ko.app.home.question.submit }).click();

    const askUrl = new URL(page.url());
    expect(askUrl.pathname).toBe(APP_ROUTE_PATHS.ask);
    expect(askUrl.searchParams.get('q')).toBe(question);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: ko.app.ask.loading.title,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('status', {
        name: ko.app.ask.loading.title,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('status', {
        name: ko.app.ask.loading.title,
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: ko.app.ask.structured.resultTitle,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: ko.app.ask.structured.fact.heading,
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByText(question)).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${APP_ROUTE_PATHS.appHome}$`));
    await expect(
      page.getByRole('heading', { level: 1, name: ko.app.home.hero.heading }),
    ).toBeVisible();
  });

  test('Home exposes the newest two canonical records and navigates to list and detail', async ({
    page,
  }) => {
    await page.goto(APP_ROUTE_PATHS.appHome);

    const recentSection = page
      .getByRole('heading', { level: 2, name: ko.app.home.recentRecords.heading })
      .locator('xpath=..');
    const recentItems = recentSection.getByRole('listitem');
    await expect(recentItems).toHaveCount(2);
    await expect(recentItems.nth(0).getByRole('link')).toHaveAttribute(
      'href',
      buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID),
    );
    await expect(recentItems.nth(1).getByRole('link')).toHaveAttribute(
      'href',
      buildAppJournalDetailPath(STUDY_ID),
    );

    await recentItems.nth(0).getByRole('link').click();
    await expect(page).toHaveURL(
      new RegExp(`${buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID)}$`),
    );
    await page.goBack();
    await expect(
      page.getByRole('heading', { level: 1, name: ko.app.home.hero.heading }),
    ).toBeVisible();

    await page.getByRole('link', { name: ko.app.home.recentRecords.viewAll }).click();
    await expect(page).toHaveURL(new RegExp(`${APP_ROUTE_PATHS.journalList}$`));
    await expect(
      page.getByRole('heading', { level: 1, name: ko.app.journalList.title }),
    ).toBeVisible();
  });

  test('Review Start keeps only its primary item active and exposes no excluded controls', async ({
    page,
  }) => {
    await page.goto(APP_ROUTE_PATHS.appHome);

    const reviewTab = page.getByRole('link', { name: ko.nav.review, exact: true });
    const journalTab = page.getByRole('link', { name: ko.nav.journal, exact: true });
    await expect(reviewTab).toHaveAttribute('aria-current', 'page');
    await expect(journalTab).not.toHaveAttribute('aria-current');

    await expect(page.locator('main form')).toHaveCount(1);
    await expect(page.locator('main textarea, main [role="textbox"]')).toHaveCount(1);
    for (const name of [
      /시장 체크|관심종목 체크/,
      /Watchlist|관심종목/,
      /오늘의 질문|추천 질문/,
      /실시간|시세|수익률|종목 순위/,
      /투자 추천|매수 추천|매도 추천/,
    ]) {
      await expect(page.getByRole('heading', { name })).toHaveCount(0);
      await expect(page.getByRole('link', { name })).toHaveCount(0);
      await expect(page.getByRole('button', { name })).toHaveCount(0);
    }
  });

  test('onboarding has no bottom navigation and its CTA navigates to app home', async ({
    page,
  }) => {
    await page.goto(APP_ROUTE_PATHS.onboarding);

    await expect(
      page.getByRole('heading', { level: 1, name: ko.app.onboarding.hero.title }),
    ).toBeVisible();
    await expect(page.getByRole('navigation', { name: ko.nav.ariaLabel })).toHaveCount(0);

    await page.getByRole('link', { name: ko.app.onboarding.cta }).click();
    await expect(page).toHaveURL(new RegExp(`${APP_ROUTE_PATHS.appHome}$`));
  });

  const OVERFLOW_CHECK_PATHS: Array<{ label: string; path: string }> = [
    { label: 'Public Home', path: buildLocaleHomePath('ko') },
    { label: 'App Home', path: APP_ROUTE_PATHS.appHome },
    { label: 'Ask', path: buildAppAskPath() },
    { label: 'Journal List', path: APP_ROUTE_PATHS.journalList },
    { label: 'Journal New', path: buildAppJournalNewPath('investment') },
    {
      label: 'Journal Detail',
      path: buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID),
    },
    {
      label: 'Journal Review',
      path: buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID),
    },
    { label: 'Onboarding', path: APP_ROUTE_PATHS.onboarding },
    { label: 'App NotFound', path: `${APP_ROUTE_PATHS.appHome}/this-route-does-not-exist` },
    { label: 'Public NotFound', path: '/fr' },
  ];

  for (const { label, path } of OVERFLOW_CHECK_PATHS) {
    test(`has no horizontal overflow at the configured viewport (${label})`, async ({ page }) => {
      await page.goto(path);
      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasHorizontalOverflow).toBe(false);
    });
  }

  test('journal list renders record cards and clicking one navigates to its encoded detail route', async ({
    page,
  }) => {
    await page.goto(APP_ROUTE_PATHS.journalList);
    const cards = page.getByRole('link').filter({ hasText: '체크 완료' });
    await expect(cards.first()).toBeVisible();

    await cards.first().click();
    await expect(page).toHaveURL(
      new RegExp(`${buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID)}$`),
    );
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: ko.app.journalList.subjects.semiconductorCompanyA,
      }),
    ).toBeVisible();
  });

  for (const detail of [
    {
      label: 'primary investment',
      id: PRIMARY_INVESTMENT_ID,
      heading: ko.app.journalList.subjects.semiconductorCompanyA,
    },
    {
      label: 'second investment',
      id: SECOND_INVESTMENT_ID,
      heading: ko.app.journalList.subjects.batteryCompanyC,
    },
    { label: 'study', id: STUDY_ID, heading: '월말 리밸런싱' },
  ]) {
    test(`renders the ${detail.label} detail fixture directly`, async ({ page }) => {
      await page.goto(buildAppJournalDetailPath(detail.id));

      await expect(
        page.getByRole('heading', { level: 1, name: ko.app.journalDetail.headerTitle }),
      ).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: detail.heading })).toBeVisible();
      await expectJournalPrimaryNavigation(page);
    });
  }

  test('journal detail navigates to the existing review route without transferring state', async ({
    page,
  }) => {
    await page.goto(buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID));

    await page.getByRole('link', { name: ko.app.journalDetail.navigation.review }).click();
    await expect(page).toHaveURL(
      new RegExp(`${buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID)}$`),
    );
    await expect(
      page.getByRole('heading', { level: 1, name: ko.app.journalReview.headerTitle }),
    ).toBeVisible();
  });

  test('journal detail survives reload and browser back without stale selection', async ({
    page,
  }) => {
    const detailPath = buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID);

    await page.goto(detailPath);
    const detailUrl = page.url();
    await expect(
      page.getByRole('heading', { level: 1, name: ko.app.journalDetail.headerTitle }),
    ).toBeVisible();
    await expect(page.getByTestId('decision-context-snapshot')).toBeVisible();
    await expect(
      page.locator('.journal-workspace-list-pane a[aria-current="page"]'),
    ).toHaveAttribute('href', detailPath);

    await page.reload();
    await expect(page).toHaveURL(detailUrl);
    await expect(
      page.getByRole('heading', { level: 1, name: ko.app.journalDetail.headerTitle }),
    ).toBeVisible();
    await expect(page.getByTestId('decision-context-snapshot')).toBeVisible();
    await expect(
      page.locator('.journal-workspace-list-pane a[aria-current="page"]'),
    ).toHaveAttribute('href', detailPath);

    await page.goto(APP_ROUTE_PATHS.journalList);
    await page.locator(`a[href="${detailPath}"]`).first().click();
    await expect(page).toHaveURL(detailPath);
    await page.goBack();
    await expect(page).toHaveURL(APP_ROUTE_PATHS.journalList);
    await expect(
      page.getByRole('heading', { level: 1, name: ko.app.journalList.title }),
    ).toBeVisible();
    await expect(page.locator('.journal-workspace-list-pane a[aria-current="page"]')).toHaveCount(
      0,
    );
    const detailPrompt = page.getByRole('heading', {
      level: 2,
      name: ko.app.journalWorkspace.detailPrompt.heading,
    });
    if ((page.viewportSize()?.width ?? 0) < 768) {
      await expect(detailPrompt).toBeHidden();
    } else {
      await expect(detailPrompt).toBeVisible();
    }
  });

  test('journal detail resolves an encoded existing id and builds a canonical review href', async ({
    page,
  }) => {
    const encodedPath = `${APP_ROUTE_PATHS.journalList}/journal%2D2026%2D06%2D28%2D01`;
    await page.goto(encodedPath);

    await expect(
      page.getByRole('heading', {
        level: 2,
        name: ko.app.journalList.subjects.semiconductorCompanyA,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: ko.app.journalDetail.navigation.review }),
    ).toHaveAttribute('href', buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID));
  });

  for (const missing of [
    {
      label: 'unknown',
      path: buildAppJournalDetailPath('unknown-record-id'),
    },
    {
      label: 'malformed encoded',
      path: `${APP_ROUTE_PATHS.journalList}/%25E0%25A4%25A`,
    },
  ]) {
    test(`journal detail renders its local Not Found for ${missing.label} id`, async ({ page }) => {
      await page.goto(missing.path);

      await expect(
        page.getByRole('heading', {
          level: 1,
          name: ko.app.journalDetail.notFound.heading,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: ko.app.journalDetail.navigation.review }),
      ).toHaveCount(0);
      await expect(page.getByRole('heading', { name: APP_NOT_FOUND })).toHaveCount(0);
    });
  }

  for (const review of [
    {
      label: 'primary investment',
      id: PRIMARY_INVESTMENT_ID,
      subject: ko.app.journalList.subjects.semiconductorCompanyA,
      section: ko.app.journalReview.investment.reflectionHeading,
    },
    {
      label: 'second investment',
      id: SECOND_INVESTMENT_ID,
      subject: ko.app.journalList.subjects.batteryCompanyC,
      section: ko.app.journalReview.investment.reflectionHeading,
    },
    {
      label: 'study',
      id: STUDY_ID,
      subject: '월말 리밸런싱',
      section: ko.app.journalReview.study.reflectionHeading,
    },
  ]) {
    test(`renders the ${review.label} review fixture directly`, async ({ page }) => {
      await page.goto(buildAppJournalReviewPath(review.id));

      await expect(
        page.getByRole('heading', { level: 1, name: ko.app.journalReview.headerTitle }),
      ).toBeVisible();
      await expect(page.getByText(review.subject, { exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: review.section })).toBeVisible();
      await expectJournalPrimaryNavigation(page);
    });
  }

  test('journal review returns to canonical record details using a deterministic link', async ({
    page,
  }) => {
    await page.goto(buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID));
    const detailLinks = page.getByRole('link', {
      name: ko.app.journalReview.navigation.detail,
    });

    await expect(detailLinks).toHaveCount(1);
    await expect(detailLinks).toHaveAttribute(
      'href',
      buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID),
    );
    await detailLinks.last().click();
    await expect(page).toHaveURL(
      new RegExp(`${buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID)}$`),
    );
    await expect(
      page.getByRole('heading', { level: 1, name: ko.app.journalDetail.headerTitle }),
    ).toBeVisible();
  });

  test('journal review resolves an encoded existing id and keeps its canonical detail href', async ({
    page,
  }) => {
    const encodedPath = `${APP_ROUTE_PATHS.journalList}/journal%2D2026%2D06%2D28%2D01/review`;
    await page.goto(encodedPath);

    await expect(
      page.getByText(ko.app.journalList.subjects.semiconductorCompanyA, { exact: true }),
    ).toBeVisible();
    const detailLinks = page.getByRole('link', {
      name: ko.app.journalReview.navigation.detail,
    });
    await expect(detailLinks.first()).toHaveAttribute(
      'href',
      buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID),
    );
  });

  for (const missing of [
    {
      label: 'unknown',
      path: buildAppJournalReviewPath('unknown-record-id'),
    },
    {
      label: 'malformed encoded',
      path: `${APP_ROUTE_PATHS.journalList}/%25E0%25A4%25A/review`,
    },
  ]) {
    test(`journal review renders its local Not Found for ${missing.label} id`, async ({ page }) => {
      await page.goto(missing.path);

      await expect(
        page.getByRole('heading', {
          level: 1,
          name: ko.app.journalReview.notFound.heading,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: ko.app.journalReview.navigation.detail }),
      ).toHaveCount(0);
      const links = page.locator('main').getByRole('link');
      for (let index = 0; index < (await links.count()); index += 1) {
        await expect(links.nth(index)).toHaveAttribute('href', APP_ROUTE_PATHS.journalList);
      }
      await expect(page.getByRole('heading', { name: APP_NOT_FOUND })).toHaveCount(0);
    });
  }

  test('journal review exposes the separate retrospective editor without mutation controls', async ({
    page,
  }) => {
    await page.goto(buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID));

    await expect(page.getByTestId('retrospective-editor')).toBeVisible();
    await expect(
      page.getByRole('textbox', {
        name: ko.app.journalReview.retrospective.bodyLabel,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: ko.app.journalReview.retrospective.save,
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /저장|제출|수정|삭제/ })).toHaveCount(0);
  });

  test('journal list: the last record card is not covered by adaptive primary navigation', async ({
    page,
  }) => {
    await page.goto(APP_ROUTE_PATHS.journalList);
    // main이 유일한 스크롤 표면이므로, 끝까지 스크롤한 뒤에도 마지막 카드가 탭바
    // 위에서 완전히 보이는지 확인한다(스크롤 전 위치는 뷰포트 밖에 있는 게 정상).
    await page.evaluate(() => {
      const main = document.querySelector('main')!;
      main.scrollTop = main.scrollHeight;
    });
    const cards = page.getByRole('link').filter({ hasText: '체크 완료' });
    const count = await cards.count();
    const lastCard = cards.nth(count - 1);
    const cardBox = (await lastCard.boundingBox())!;
    const nav = page.getByRole('navigation', { name: ko.nav.ariaLabel });
    const navBox = (await nav.boundingBox())!;
    if (page.viewportSize()!.width < 768) {
      expect(cardBox.y + cardBox.height).toBeLessThanOrEqual(navBox.y + 1);
    } else {
      expect(cardBox.y + cardBox.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
    }
  });
});

test.describe('Ask empty and result states', () => {
  for (const { label, path } of [
    { label: 'missing q', path: APP_ROUTE_PATHS.ask },
    { label: 'empty q', path: `${APP_ROUTE_PATHS.ask}?q=` },
    { label: 'space-only q', path: `${APP_ROUTE_PATHS.ask}?q=%20%20%20` },
  ]) {
    test(`renders the empty state for ${label}`, async ({ page }) => {
      await page.goto(path);

      await expect(
        page.getByRole('heading', { level: 1, name: ko.app.ask.header.title }),
      ).toBeVisible();
      await expect(page.getByText(ko.app.ask.empty.description)).toBeVisible();
      await expect(page.getByRole('link', { name: ko.app.ask.empty.cta })).toHaveAttribute(
        'href',
        APP_ROUTE_PATHS.appHome,
      );
    });
  }

  test('renders an encoded question with structured fixture provenance', async ({ page }) => {
    const question = '실적 전망 & 산업 흐름은 어떻게 확인할까?';
    await page.goto(buildAppAskPath(question));

    await expect(page.getByText(question)).toBeVisible();
    await expect(page.getByRole('note')).toHaveText(ko.app.ask.structured.provenance);
    await expect(
      page.getByRole('heading', { name: ko.app.ask.structured.fact.heading }),
    ).toBeVisible();
  });

  test('navigates through the two result CTAs without transferring the question', async ({
    page,
  }) => {
    const question = 'CTA 경로 확인';
    const cases = [
      {
        label: ko.app.ask.navigation.studyNote,
        target: buildAppJournalNewPath('study'),
      },
      {
        label: ko.app.ask.navigation.investmentRecord,
        target: buildAppJournalNewPath('investment'),
      },
    ];

    for (const item of cases) {
      await page.goto(buildAppAskPath(question));
      await page.getByRole('link', { name: item.label }).click();
      const url = new URL(page.url());
      expect(`${url.pathname}${url.search}`).toBe(item.target);
      expect(url.searchParams.has('q')).toBe(false);
    }
  });

  test('keeps Review Result in Review IA without a phone bottom navigation', async ({ page }) => {
    await page.goto(buildAppAskPath('활성 탭 확인'));

    const navigation = page.getByRole('navigation', { name: ko.nav.ariaLabel });
    if (page.viewportSize()!.width < 768) {
      await expect(navigation).toHaveCount(0);
    } else {
      await expect(navigation).toBeVisible();
      await expect(
        page.getByTestId('primary-navigation').getByRole('link', { name: ko.nav.review }),
      ).toHaveAttribute('aria-current', 'page');
    }
  });

  test('renders HTML-like input as inert text', async ({ page }) => {
    const question = '<script>alert(1)</script>';
    let dialogOpened = false;
    page.on('dialog', async (dialog) => {
      dialogOpened = true;
      await dialog.dismiss();
    });

    await page.goto(buildAppAskPath(question));

    await expect(page.getByText(question)).toBeVisible();
    await expect(page.locator('main script')).toHaveCount(0);
    expect(dialogOpened).toBe(false);
  });
});

test.describe('Onboarding English locale', () => {
  test.use({ locale: 'en-US' });

  test('renders the English content without horizontal overflow', async ({ page }) => {
    await page.goto(APP_ROUTE_PATHS.onboarding);

    await expect(
      page.getByRole('heading', { level: 1, name: en.app.onboarding.hero.title }),
    ).toBeVisible();
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});

test.describe('Ask English locale', () => {
  test.use({ locale: 'en-US' });

  test('renders the English empty and result states', async ({ page }) => {
    await page.goto(APP_ROUTE_PATHS.ask);
    await expect(
      page.getByRole('heading', { level: 1, name: en.app.ask.header.title }),
    ).toBeVisible();
    await expect(page.getByText(en.app.ask.empty.description)).toBeVisible();

    const question = 'How should I review the business assumptions?';
    await page.goto(buildAppAskPath(question));
    await expect(page.getByText(question)).toBeVisible();
    await expect(page.getByRole('note')).toHaveText(en.app.ask.structured.provenance);
    await expect(
      page.getByRole('heading', { name: en.app.ask.structured.fact.heading }),
    ).toBeVisible();
  });
});

test.describe('Home English locale', () => {
  test.use({ locale: 'en-US' });

  test('renders English Home labels while preserving fixture-authored record text', async ({
    page,
  }) => {
    await page.goto(APP_ROUTE_PATHS.appHome);

    await expect(
      page.getByRole('heading', { level: 1, name: en.app.home.hero.heading }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: en.app.home.recentRecords.heading }),
    ).toBeVisible();
    await expect(page.getByRole('textbox', { name: en.app.home.question.label })).toBeVisible();
    await expect(page.getByRole('button', { name: en.app.home.question.submit })).toBeVisible();
    await expect(page.getByText('반도체 기업 A 요즘 어때?')).toBeVisible();
  });
});

test.describe('Journal detail English locale', () => {
  test.use({ locale: 'en-US' });

  test('renders English detail labels while preserving the fixture-authored record', async ({
    page,
  }) => {
    await page.goto(buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID));

    await expect(
      page.getByRole('heading', { level: 1, name: en.app.journalDetail.headerTitle }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: en.app.journalList.subjects.semiconductorCompanyA,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: en.app.journalDetail.investment.questionHeading,
      }),
    ).toBeVisible();
    const questionSection = page
      .getByRole('heading', {
        name: en.app.journalDetail.investment.questionHeading,
      })
      .locator('..');
    await expect(questionSection.getByText('반도체 기업 A 요즘 어때?')).toBeVisible();
  });
});

test.describe('Journal review English locale', () => {
  test.use({ locale: 'en-US' });

  test('renders English review labels while preserving the fixture-authored record', async ({
    page,
  }) => {
    await page.goto(buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID));

    await expect(
      page.getByRole('heading', { level: 1, name: en.app.journalReview.headerTitle }),
    ).toBeVisible();
    await expect(
      page.getByText(en.app.journalList.subjects.semiconductorCompanyA, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: en.app.journalReview.investment.reflectionHeading,
      }),
    ).toBeVisible();
    await expect(page.getByText('반도체 기업 A 요즘 어때?', { exact: true }).first()).toBeVisible();
  });
});
