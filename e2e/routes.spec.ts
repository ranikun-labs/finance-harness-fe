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
import { ko } from '@/i18n/messages/ko';

const SAMPLE_ID = 'sample-id';
const APP_NOT_FOUND = '페이지를 찾을 수 없어요';
const PUBLIC_NOT_FOUND = '공개 페이지를 찾을 수 없어요';

const APP_SCREENS: Array<{ path: string; heading: string | RegExp }> = [
  { path: APP_ROUTE_PATHS.onboarding, heading: '온보딩' },
  { path: APP_ROUTE_PATHS.appHome, heading: 'Home' },
  { path: buildAppAskPath(), heading: 'Ask 결과' },
  { path: APP_ROUTE_PATHS.journalList, heading: '기록' },
  { path: buildAppJournalNewPath('investment'), heading: '일지 저장 (투자 기록)' },
  { path: buildAppJournalDetailPath(SAMPLE_ID), heading: /일지 상세/ },
  { path: buildAppJournalReviewPath(SAMPLE_ID), heading: /복기/ },
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

  const OVERFLOW_CHECK_PATHS: Array<{ label: string; path: string }> = [
    { label: 'Public Home', path: buildLocaleHomePath('ko') },
    { label: 'App Home', path: APP_ROUTE_PATHS.appHome },
    { label: 'Ask', path: buildAppAskPath() },
    { label: 'Journal List', path: APP_ROUTE_PATHS.journalList },
    { label: 'Journal New', path: buildAppJournalNewPath('investment') },
    { label: 'Journal Detail', path: buildAppJournalDetailPath(SAMPLE_ID) },
    { label: 'Journal Review', path: buildAppJournalReviewPath(SAMPLE_ID) },
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
    await expect(page).toHaveURL(new RegExp(`${APP_ROUTE_PATHS.journalList}/[^/]+$`));
  });

  test('journal list: the last record card is not covered by the bottom navigation', async ({
    page,
  }) => {
    await page.goto(APP_ROUTE_PATHS.journalList);
    const cards = page.getByRole('link').filter({ hasText: '체크 완료' });
    const count = await cards.count();
    const lastCard = cards.nth(count - 1);
    const cardBox = (await lastCard.boundingBox())!;
    const nav = page.getByRole('navigation', { name: ko.nav.ariaLabel });
    const navBox = (await nav.boundingBox())!;
    expect(cardBox.y + cardBox.height).toBeLessThanOrEqual(navBox.y + 1);
  });
});
