import { expect, test } from '@playwright/test';

import { BOTTOM_TABS } from '@/constants/navigation';
import {
  ROUTE_PATHS,
  buildAskPath,
  buildJournalDetailPath,
  buildJournalNewPath,
  buildJournalReviewPath,
} from '@/constants/routes';

const SAMPLE_ID = 'sample-id';

const SCREENS: Array<{ path: string; heading: string | RegExp }> = [
  { path: ROUTE_PATHS.onboarding, heading: '온보딩' },
  { path: ROUTE_PATHS.home, heading: 'Home' },
  { path: buildAskPath(), heading: 'Ask 결과' },
  { path: ROUTE_PATHS.journalList, heading: '기록 목록' },
  { path: buildJournalNewPath('investment'), heading: '일지 저장 (투자 기록)' },
  { path: buildJournalDetailPath(SAMPLE_ID), heading: /일지 상세/ },
  { path: buildJournalReviewPath(SAMPLE_ID), heading: /복기/ },
];

test.describe('nav-map 라우트 스모크 테스트', () => {
  for (const screen of SCREENS) {
    test(`renders ${screen.path}`, async ({ page }) => {
      await page.goto(screen.path);
      await expect(page.getByRole('heading', { name: screen.heading })).toBeVisible();
    });
  }

  test('renders NotFound for an undefined path', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없어요' })).toBeVisible();
  });

  test('bottom tabs navigate to the correct routes', async ({ page }) => {
    await page.goto(ROUTE_PATHS.home);

    for (const tab of BOTTOM_TABS) {
      await page.getByRole('link', { name: tab.label }).click();
      const url = new URL(page.url());
      expect(url.pathname).toBe(tab.path);
    }
  });

  const OVERFLOW_CHECK_PATHS: Array<{ label: string; path: string }> = [
    { label: 'Home', path: ROUTE_PATHS.home },
    { label: 'Ask', path: buildAskPath() },
    { label: 'Journal List', path: ROUTE_PATHS.journalList },
    { label: 'Journal New', path: buildJournalNewPath('investment') },
    { label: 'Journal Detail', path: buildJournalDetailPath(SAMPLE_ID) },
    { label: 'Journal Review', path: buildJournalReviewPath(SAMPLE_ID) },
    { label: 'Onboarding', path: ROUTE_PATHS.onboarding },
    { label: 'NotFound', path: '/this-route-does-not-exist' },
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
});
