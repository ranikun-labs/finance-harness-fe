import { expect, type Page } from '@playwright/test';

import { ko } from '@/i18n/messages/ko';

/**
 * 상단 내비 viewport의 한 줄 셸: 앱 헤더가 viewport 폭을 쓰고, 제품 이름 · 내비 · 로그인(있을 때)이
 * 같은 가로줄에 순서대로 놓인다. 내비는 자체 막대를 갖지 않고 헤더 안에 있다.
 */
export async function expectOneLineShell(page: Page, label: string) {
  const header = page.getByTestId('app-shell-host').locator('> header');
  const navigation = page.getByTestId('primary-navigation');
  const name = header.getByText(ko.common.appName, { exact: true });
  const headerBox = (await header.boundingBox())!;
  const navBox = (await navigation.boundingBox())!;
  const nameBox = (await name.boundingBox())!;
  const viewportWidth = page.viewportSize()!.width;

  expect(headerBox.width, `${label} header width`).toBe(viewportWidth);
  expect(headerBox.height, `${label} header height`).toBeLessThan(100);
  expect(await header.locator('[data-testid="primary-navigation"]').count(), label).toBe(1);
  // 같은 줄: 세 요소의 세로 중심이 헤더 한 줄 안에서 어긋나지 않는다.
  const centerY = (box: { y: number; height: number }) => box.y + box.height / 2;
  expect(Math.abs(centerY(navBox) - centerY(nameBox)), `${label} name/nav same row`).toBeLessThan(
    4,
  );
  expect(navBox.y, `${label} nav inside header`).toBeGreaterThanOrEqual(headerBox.y);
  expect(navBox.y + navBox.height, `${label} nav inside header`).toBeLessThanOrEqual(
    headerBox.y + headerBox.height,
  );
  // 순서: 이름 → 내비 (내비가 이름 오른쪽).
  expect(navBox.x, `${label} nav after name`).toBeGreaterThan(nameBox.x + nameBox.width);
  const signIn = header.getByRole('link', { name: ko.nav.signIn });
  if ((await signIn.count()) > 0) {
    const signInBox = (await signIn.boundingBox())!;
    expect(
      Math.abs(centerY(signInBox) - centerY(navBox)),
      `${label} nav/signIn same row`,
    ).toBeLessThan(4);
    expect(signInBox.x, `${label} signIn after nav`).toBeGreaterThanOrEqual(
      navBox.x + navBox.width,
    );
  }
  const mainBox = (await page.locator('main').boundingBox())!;
  expect(mainBox.y, `${label} main starts right below the one-line shell`).toBeGreaterThanOrEqual(
    headerBox.y + headerBox.height,
  );
  expect(mainBox.y, `${label} main top`).toBeLessThan(90);
}
