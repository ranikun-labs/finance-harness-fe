import { expect, test, type Page } from '@playwright/test';

import {
  APP_ROUTE_PATHS,
  AUTH_ROUTE_PATHS,
  buildFeaturesPath,
  buildAppJournalDetailPath,
  buildLearnPath,
  buildLocaleHomePath,
} from '@/constants/routes';
import { en } from '@/i18n/messages/en';
import { ko } from '@/i18n/messages/ko';
import { PRERENDER_MANIFEST } from '@/prerender/manifest';

const MONOLITHIC_FONT_REQUEST = /\.woff2?(?:\?|$)/i;
const MONOLITHIC_FONT_ASSET = /\/PretendardVariable\.woff2(?:\?|$)/;

async function settleFonts(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await document.fonts.load('16px "Pretendard Variable"', document.body.innerText);
  });
}

test.describe('STEP 12 A11Y-01 landmark regression', () => {
  for (const routePath of [
    buildLocaleHomePath('ko'),
    buildLocaleHomePath('en'),
    buildFeaturesPath('ko'),
    buildLearnPath('en'),
    '/fr',
    '/app/not-a-route',
  ]) {
    test(`${routePath} has one main and one h1`, async ({ page }) => {
      await page.goto(routePath);
      await expect(page.locator('main')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveCount(1);
    });
  }
});

test.describe('STEP 12 META-01 prerender and hydration title parity', () => {
  test('prerendered title and hydrated title share the route mapping', async ({
    page,
    request,
  }) => {
    const titles = new Set<string>();

    for (const entry of PRERENDER_MANIFEST) {
      const response = await request.get(`/${entry.outFile}`);
      const body = await response.text();
      expect(body).toContain(`<title>${entry.title}</title>`);

      await page.goto(`${entry.path}/`);
      const titleBeforeHydrationSettles = await page.title();
      await page.waitForLoadState('networkidle');
      const titleAfterHydration = await page.title();

      expect(titleBeforeHydrationSettles).toBe(entry.title);
      expect(titleAfterHydration).toBe(entry.title);
      titles.add(entry.title);
    }

    expect(titles.size).toBe(PRERENDER_MANIFEST.length);
    expect(await page.title()).not.toBe(ko.common.appName);
  });
});

test.describe('STEP 12 PERF-01 subset resource audit', () => {
  test('/ko requests subset fonts and preserves Korean glyph rendering', async ({ page }) => {
    const fontRequests: string[] = [];
    page.on('request', (request) => {
      if (MONOLITHIC_FONT_REQUEST.test(request.url())) fontRequests.push(request.url());
    });

    await page.goto(buildLocaleHomePath('ko'));
    await expect(page.getByRole('heading', { name: ko.public.home.title })).toBeVisible();
    await settleFonts(page);

    expect(fontRequests.length).toBeGreaterThan(0);
    expect(fontRequests.every((url) => url.includes('PretendardVariable.subset'))).toBe(true);
    expect(fontRequests.some((url) => url.includes('.subset.'))).toBe(true);
    expect(fontRequests.filter((url) => MONOLITHIC_FONT_ASSET.test(url))).toHaveLength(0);
  });

  test('/en requests subset fonts and preserves English glyph rendering', async ({ page }) => {
    const fontRequests: string[] = [];
    page.on('request', (request) => {
      if (MONOLITHIC_FONT_REQUEST.test(request.url())) fontRequests.push(request.url());
    });

    await page.goto(buildLocaleHomePath('en'));
    await expect(page.getByRole('heading', { name: en.public.home.title })).toBeVisible();
    await settleFonts(page);

    expect(fontRequests.length).toBeGreaterThan(0);
    expect(fontRequests.every((url) => url.includes('PretendardVariable.subset'))).toBe(true);
    expect(fontRequests.some((url) => url.includes('.subset.'))).toBe(true);
    expect(fontRequests.filter((url) => MONOLITHIC_FONT_ASSET.test(url))).toHaveLength(0);
  });
});

test.describe('STEP 12 PERF-02 route chunk/resource audit', () => {
  test('public initial load excludes journal chunks and app navigation loads a route chunk', async ({
    page,
  }) => {
    const publicScripts = new Set<string>();
    const appScripts = new Set<string>();
    let phase: 'public' | 'app' = 'public';

    page.on('request', (request) => {
      if (request.resourceType() !== 'script') return;
      if (phase === 'public') publicScripts.add(request.url());
      else appScripts.add(request.url());
    });

    await page.goto(buildLocaleHomePath('ko'));
    await page.waitForLoadState('networkidle');

    phase = 'app';
    await page.goto(APP_ROUTE_PATHS.journalList);
    await expect(page.getByRole('heading', { name: ko.app.journalList.title })).toBeVisible();
    await page.waitForLoadState('networkidle');

    const appOnlyScripts = [...appScripts].filter((url) => !publicScripts.has(url));
    expect(publicScripts.size).toBeGreaterThan(0);
    expect([...publicScripts].filter((url) => /journal|review/i.test(url))).toHaveLength(0);
    expect(appOnlyScripts.length).toBeGreaterThan(0);
    expect(appOnlyScripts.some((url) => /journal|review/i.test(url))).toBe(true);

    const detailLink = page
      .locator('.journal-workspace-list-pane a[href^="/app/journal/"]')
      .first();
    await expect(detailLink).toBeVisible();
    await detailLink.click();
    await expect(page).toHaveURL(/\/app\/journal\/[^/]+$/);
    await expect(
      page.getByRole('heading', { name: ko.app.journalDetail.headerTitle }),
    ).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${APP_ROUTE_PATHS.journalList}$`));
    await expect(page.getByRole('heading', { name: ko.app.journalList.title })).toBeVisible();
  });
});

const LAZY_APP_CHUNK =
  /\/assets\/(?:AppShellRoute|TabLayout|HomePage|AuthEntryPage|JournalWorkspace|JournalListPage|JournalDetailPage|JournalReviewPage|JournalNewPage|OnboardingPage|NotFoundPage)-[^/]+\.js/;

test.describe('STEP 12 PERF-02 lazy loading surface regression', () => {
  for (const [label, routePath, finalHeading] of [
    ['app home', APP_ROUTE_PATHS.appHome, ko.app.home.hero.heading],
    ['auth entry', AUTH_ROUTE_PATHS.entry, ko.auth.entry.heading],
    ['journal list', APP_ROUTE_PATHS.journalList, ko.app.journalList.title],
    [
      'journal detail',
      buildAppJournalDetailPath('550e8400-e29b-41d4-a716-446655440000'),
      ko.app.journalDetail.headerTitle,
    ],
  ] as const) {
    test(`keeps a visible accessible surface during delayed direct ${label} load`, async ({
      page,
    }) => {
      let delayedChunkStarted = false;
      await page.route('**/assets/*.js', async (route) => {
        if (!LAZY_APP_CHUNK.test(route.request().url())) {
          await route.continue();
          return;
        }

        delayedChunkStarted = true;
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await route.continue();
      });

      await page.goto(routePath, { waitUntil: 'commit' });
      await expect.poll(() => delayedChunkStarted).toBe(true);

      await expect(page.locator('body')).toHaveText(/\S/);
      await expect(page.getByRole('status')).toBeVisible();
      await expect(page.locator('main')).toHaveCount(1);
      await expect(page.getByRole('heading', { name: ko.public.notFound.heading })).toHaveCount(0);
      await expect(page.getByRole('heading', { name: finalHeading })).toBeVisible();
    });
  }

  test('keeps the app shell and an accessible status during delayed client navigation', async ({
    page,
  }) => {
    await page.goto(APP_ROUTE_PATHS.appHome);
    await expect(page.getByRole('heading', { name: ko.app.home.hero.heading })).toBeVisible();

    let delayedChunkStarted = false;
    await page.route('**/assets/*.js', async (route) => {
      if (!LAZY_APP_CHUNK.test(route.request().url())) {
        await route.continue();
        return;
      }

      delayedChunkStarted = true;
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });

    await page.getByRole('link', { name: ko.nav.journal }).click();
    await expect.poll(() => delayedChunkStarted).toBe(true);
    await expect(page.getByTestId('app-shell-host')).toBeVisible();
    await expect(page.getByRole('navigation', { name: ko.nav.ariaLabel })).toBeVisible();
    await expect(page.locator('body')).toHaveText(/\S/);
    await expect(page.getByRole('status')).toBeVisible();
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: ko.public.notFound.heading })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: ko.app.journalList.title })).toBeVisible();
  });
});
