import { expect, test } from '@playwright/test';

import { APP_ROUTE_PATHS } from '@/constants/routes';

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
});
