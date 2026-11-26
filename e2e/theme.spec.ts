import { expect, test, type Page } from '@playwright/test';

import { APP_ROUTE_PATHS } from '@/constants/routes';
import { ko } from '@/i18n/messages/ko';
import { THEME_COLOR, THEME_STORAGE_KEY } from '@/theme/theme';

const isDark = (page: Page) =>
  page.evaluate(() => document.documentElement.classList.contains('dark'));
const themeColor = (page: Page) =>
  page.evaluate(() => document.querySelector('meta[name="theme-color"]')?.getAttribute('content'));
const pageBg = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

async function choose(page: Page, label: string) {
  await page.getByTestId('theme-trigger').click();
  await page.getByRole('radio', { name: label, exact: true }).check();
  await page.getByRole('button', { name: ko.theme.close }).click();
}

test.describe('화면 모드 (시스템/라이트/다크)', () => {
  test('저장값이 없으면 시스템 설정을 따르고, 실행 중 바뀌어도 즉시 반영한다', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(APP_ROUTE_PATHS.appHome);
    expect(await isDark(page)).toBe(false);
    expect(await themeColor(page)).toBe(THEME_COLOR.light);

    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(() => isDark(page)).toBe(true);
    expect(await themeColor(page)).toBe(THEME_COLOR.dark);
    expect(await page.evaluate(() => document.documentElement.style.colorScheme)).toBe('dark');
    expect(await pageBg(page)).toBe('rgb(15, 17, 20)');
  });

  test('선택은 이 브라우저에만 저장되고 새로고침 후에도 유지되며 서버 요청을 만들지 않는다', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(APP_ROUTE_PATHS.appHome);
    const writes: string[] = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET') writes.push(request.url());
    });

    await choose(page, ko.theme.dark);
    expect(await isDark(page)).toBe(true);
    expect(await page.evaluate((key) => localStorage.getItem(key), THEME_STORAGE_KEY)).toBe('dark');

    // 시스템이 라이트여도 명시 선택이 우선한다.
    await page.reload();
    expect(await isDark(page)).toBe(true);
    await page.emulateMedia({ colorScheme: 'light' });
    expect(await isDark(page)).toBe(true);

    await choose(page, ko.theme.system);
    expect(await isDark(page)).toBe(false);
    expect(await page.evaluate((key) => localStorage.getItem(key), THEME_STORAGE_KEY)).toBeNull();
    expect(writes).toEqual([]);
  });

  test('첫 페인트 전 인라인 스크립트만으로 다크가 적용된다(앱 번들 없이)', async ({ page }) => {
    await page.route('**/*.js', (route) => route.abort());
    await page.addInitScript((key) => localStorage.setItem(key, 'dark'), THEME_STORAGE_KEY);
    await page.goto(APP_ROUTE_PATHS.appHome, { waitUntil: 'domcontentloaded' });
    expect(await isDark(page)).toBe(true);
    expect(await themeColor(page)).toBe(THEME_COLOR.dark);
    expect(await pageBg(page)).toBe('rgb(15, 17, 20)');
  });

  test('손상된 저장값은 무시하고 시스템 설정을 따른다', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript((key) => localStorage.setItem(key, 'sepia'), THEME_STORAGE_KEY);
    await page.goto(APP_ROUTE_PATHS.appHome);
    expect(await isDark(page)).toBe(true);
  });

  test('전환해도 작성 중인 입력이 유지되고, 회전(가로/세로)해도 모드가 유지된다', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chromium', 'viewport를 직접 지정한다');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(APP_ROUTE_PATHS.appHome);
    const field = page.locator('#review-question');
    await field.fill('전환 중에도 남아야 하는 질문');

    await choose(page, ko.theme.dark);
    await expect(field).toHaveValue('전환 중에도 남아야 하는 질문');
    expect(await isDark(page)).toBe(true);

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(field).toHaveValue('전환 중에도 남아야 하는 질문');
    expect(await isDark(page)).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });

  test('다크 다이얼로그: 모드 선택 라디오는 키보드로 조작되고 닫으면 트리거로 포커스가 돌아온다', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(APP_ROUTE_PATHS.appHome);
    const trigger = page.getByTestId('theme-trigger');
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: ko.theme.title });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('radio', { name: ko.theme.system })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('radio', { name: ko.theme.light, exact: true })).toBeChecked();
    expect(await isDark(page)).toBe(false);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test.describe('폰 안쪽 화면의 화면 모드 (F3 F-08)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('작성 화면에서도 화면 모드 버튼이 닿고 바꾸면 즉시 적용된다', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(APP_ROUTE_PATHS.journalNew);
    const trigger = page.getByTestId('theme-trigger');
    await expect(trigger).toBeVisible();
    expect((await trigger.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    await choose(page, ko.theme.dark);
    expect(await isDark(page)).toBe(true);
    await page.reload();
    expect(await isDark(page)).toBe(true);
  });
});
