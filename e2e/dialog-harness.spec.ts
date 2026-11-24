import { expect, test } from '@playwright/test';

// 공통 Dialog(native <dialog> + showModal)의 실제 브라우저 동작: 초기 포커스·Tab 순환·ESC·
// 배경 비활성·스크롤 잠금·포커스 복귀. jsdom 단위 테스트가 재현하지 못하는 부분이다.
test.describe('Dialog keyboard and focus contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/support/dialog-harness/');
  });

  test('focuses Cancel first, traps Tab, closes on ESC and returns focus to the trigger', async ({
    page,
  }) => {
    const trigger = page.locator('#trigger');
    await trigger.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('alertdialog', { name: '기록을 삭제할까요?' });
    await expect(dialog).toBeVisible();
    // 파괴적 확인: 초기 포커스는 취소.
    await expect(page.getByRole('button', { name: '취소' })).toBeFocused();
    // 취소(왼쪽) → 삭제(오른쪽) 순서.
    const order = await dialog.getByRole('button').allTextContents();
    expect(order).toEqual(['취소', '삭제']);

    // Tab을 여러 번 눌러도 포커스가 다이얼로그 밖으로 나가지 않는다.
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
    }
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Shift+Tab');
      expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
    }

    // 배경은 비활성(모달 top layer)이고 body 스크롤이 잠긴다.
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    expect(await page.evaluate(() => document.querySelector('dialog')?.matches(':modal'))).toBe(
      true,
    );

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  });

  test('confirm runs the action once and returns focus to the trigger', async ({ page }) => {
    await page.locator('#trigger').click();
    await page.getByRole('button', { name: '삭제', exact: true }).click();
    await expect(page.getByTestId('confirmed')).toHaveText('1');
    await expect(page.getByRole('alertdialog')).toBeHidden();
    await expect(page.locator('#trigger')).toBeFocused();
  });

  test('cancel does not run the destructive action', async ({ page }) => {
    await page.locator('#trigger').click();
    await page.getByRole('button', { name: '취소' }).click();
    await expect(page.getByTestId('confirmed')).toHaveText('0');
    await expect(page.locator('#trigger')).toBeFocused();
  });
});
