import { expect, test } from '@playwright/test';

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

const APP_SCREENS: Array<{ path: string; heading: string | RegExp }> = [
  { path: APP_ROUTE_PATHS.onboarding, heading: ko.app.onboarding.hero.title },
  { path: APP_ROUTE_PATHS.appHome, heading: 'Home' },
  { path: buildAppAskPath(), heading: ko.app.ask.header.title },
  { path: APP_ROUTE_PATHS.journalList, heading: '기록' },
  { path: buildAppJournalNewPath('investment'), heading: '일지 저장 (투자 기록)' },
  { path: buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID), heading: ko.app.journalDetail.title },
  { path: buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID), heading: /복기/ },
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
      await page.getByRole('link', { name: ko.nav[tab.id] }).click();
      const url = new URL(page.url());
      expect(url.pathname).toBe(tab.path);
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
        page.getByRole('heading', { level: 1, name: ko.app.journalDetail.title }),
      ).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: detail.heading })).toBeVisible();
      await expect(page.getByRole('navigation', { name: ko.nav.ariaLabel })).toHaveCount(0);
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
    await expect(page.getByRole('heading', { name: /복기/ })).toBeVisible();
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

  test('journal list: the last record card is not covered by the bottom navigation', async ({
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
    expect(cardBox.y + cardBox.height).toBeLessThanOrEqual(navBox.y + 1);
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

  test('renders an encoded question with the static fixture notice', async ({ page }) => {
    const question = '실적 전망 & 산업 흐름은 어떻게 확인할까?';
    await page.goto(buildAppAskPath(question));

    await expect(page.getByText(question)).toBeVisible();
    await expect(page.getByRole('note')).toHaveText(ko.app.ask.fixtureNotice);
    await expect(
      page.getByRole('heading', { name: ko.app.ask.perspectives.heading }),
    ).toBeVisible();
  });

  test('navigates through all three result CTAs without transferring the question', async ({
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
      {
        label: ko.app.ask.navigation.askAgain,
        target: APP_ROUTE_PATHS.appHome,
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

  test('keeps the Ask bottom tab active in the result state', async ({ page }) => {
    await page.goto(buildAppAskPath('활성 탭 확인'));

    const askTab = page.getByRole('link', { name: ko.nav.ask, exact: true });
    await expect(askTab).toHaveAttribute('aria-current', 'page');
    await expect(askTab.getByTestId('bottom-tab-active-indicator')).toBeVisible();
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
    await expect(page.getByRole('note')).toHaveText(en.app.ask.fixtureNotice);
    await expect(page.getByRole('link', { name: en.app.ask.navigation.askAgain })).toBeVisible();
  });
});

test.describe('Journal detail English locale', () => {
  test.use({ locale: 'en-US' });

  test('renders English detail labels while preserving the fixture-authored record', async ({
    page,
  }) => {
    await page.goto(buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID));

    await expect(
      page.getByRole('heading', { level: 1, name: en.app.journalDetail.title }),
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
    await expect(page.getByText('반도체 기업 A 요즘 어때?')).toBeVisible();
  });
});
