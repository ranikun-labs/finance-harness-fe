import { expect, test } from '@playwright/test';

import {
  APP_ROUTE_PATHS,
  buildFeaturesPath,
  buildLearnPath,
  buildLocaleHomePath,
} from '@/constants/routes';
import { APP_LOCALE_STORAGE_KEY } from '@/i18n/appLocale';

const PUBLIC_NOT_FOUND_KO = '공개 페이지를 찾을 수 없어요';

test.describe('공개 웹 locale: URL이 유일한 source of truth', () => {
  test('/ko는 한국어, /en은 영어로 렌더된다', async ({ page }) => {
    await page.goto(buildLocaleHomePath('ko'));
    await expect(page.getByRole('heading', { name: /공개 웹 홈/ })).toBeVisible();

    await page.goto(buildLocaleHomePath('en'));
    await expect(page.getByRole('heading', { name: /Public Home/ })).toBeVisible();
  });

  test('/fr(미지원 locale)은 redirect 없이 DEFAULT_LOCALE(ko) 문구로 PublicNotFound를 렌더한다', async ({
    page,
  }) => {
    await page.goto('/fr');
    await expect(page).toHaveURL(/\/fr$/);
    await expect(page.getByRole('heading', { name: PUBLIC_NOT_FOUND_KO })).toBeVisible();
  });

  test('/en에 저장된 앱 locale이 ko여도 최초 렌더는 영어다(공개-앱 독립)', async ({
    page,
    context,
  }) => {
    await context.addInitScript(
      ([key, value]) => window.localStorage.setItem(key, value),
      [APP_LOCALE_STORAGE_KEY, 'ko'],
    );
    await page.goto(buildLocaleHomePath('en'));
    await expect(page.getByRole('heading', { name: /Public Home/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');
  });
});

test.describe('LocaleSwitcher: 전환·query/hash 보존·document.lang 동기화', () => {
  test('링크 클릭으로 /ko/features → /en/features, path·query·hash 유지 + document.lang 갱신', async ({
    page,
  }) => {
    await page.goto(`${buildFeaturesPath('ko')}?x=1#y`);
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('ko');

    await page.getByRole('link', { name: 'English' }).click();

    await expect(page).toHaveURL(new RegExp(`${buildFeaturesPath('en')}\\?x=1#y$`));
    await expect(page.getByRole('heading', { name: /Features/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');
  });

  test('learn 하위 slug를 유지한 채 반대 방향(en→ko)으로도 전환된다', async ({ page }) => {
    await page.goto(buildLearnPath('en', 'basics'));
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');

    await page.getByRole('link', { name: '한국어' }).click();

    await expect(page).toHaveURL(new RegExp(`${buildLearnPath('ko', 'basics')}$`));
    await expect(page.getByRole('heading', { name: /학습/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('ko');
  });

  test('현재 locale 링크에 aria-current가 표시된다', async ({ page }) => {
    await page.goto(buildLocaleHomePath('ko'));
    await expect(page.getByRole('link', { name: '한국어' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await expect(page.getByRole('link', { name: 'English' })).not.toHaveAttribute('aria-current');
  });
});

test.describe('앱(/app/*) locale: 저장·복원·잘못된 값 처리', () => {
  test('저장된 유효 locale(en)을 복원하고 document.lang도 일치한다', async ({ page, context }) => {
    await context.addInitScript(
      ([key, value]) => window.localStorage.setItem(key, value),
      [APP_LOCALE_STORAGE_KEY, 'en'],
    );
    await page.goto(APP_ROUTE_PATHS.appHome);
    await expect(page.getByRole('link', { name: 'Ask' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');
  });

  test('잘못된 저장값은 DEFAULT_LOCALE(ko)로 안전하게 복구되고 document.lang도 ko다', async ({
    page,
    context,
  }) => {
    await context.addInitScript(
      ([key, value]) => window.localStorage.setItem(key, value),
      [APP_LOCALE_STORAGE_KEY, 'xx-not-a-locale'],
    );
    await page.goto(APP_ROUTE_PATHS.appHome);
    await expect(page.getByRole('link', { name: '질문' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('ko');
  });

  test('새로고침 후에도 저장된 앱 locale이 유지된다', async ({ page, context }) => {
    await context.addInitScript(
      ([key, value]) => window.localStorage.setItem(key, value),
      [APP_LOCALE_STORAGE_KEY, 'en'],
    );
    await page.goto(APP_ROUTE_PATHS.appHome);
    await expect(page.getByRole('link', { name: 'Ask' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('link', { name: 'Ask' })).toBeVisible();
  });

  test('앱 locale 변경이 공개 URL에 영향을 주지 않는다(독립성)', async ({ page, context }) => {
    await context.addInitScript(
      ([key, value]) => window.localStorage.setItem(key, value),
      [APP_LOCALE_STORAGE_KEY, 'en'],
    );
    await page.goto(buildLocaleHomePath('ko'));
    await expect(page.getByRole('heading', { name: /공개 웹 홈/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('ko');
  });
});
