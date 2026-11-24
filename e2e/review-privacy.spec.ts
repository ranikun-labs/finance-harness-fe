import { expect, test } from '@playwright/test';
import { ko } from '@/i18n/messages/ko';
import { startReview } from './review-test-flow';

for (const type of ['investment', 'study'] as const) {
  test(`restores the checklist after ${type} auth cancel without storing the question in history`, async ({
    page,
  }) => {
    const question = 'private review question 726';
    await startReview(page, question);
    await expect(page.getByText(question)).toBeVisible();
    const resultUrl = page.url();
    expect(resultUrl).not.toContain(question);
    expect(decodeURIComponent(resultUrl)).not.toContain(question);
    expect(JSON.stringify(await page.evaluate(() => history.state))).not.toContain(question);
    const checklist = page.getByRole('region', { name: ko.app.ask.structured.checklist.heading });
    const firstCheck = checklist.getByRole('button').first();
    await firstCheck.click();
    await expect(checklist.getByText('1/4 확인')).toBeVisible();
    await page.getByRole('link', { name: new RegExp(ko.app.ask.handoff[type].title) }).click();
    await expect(page).toHaveURL(/\/auth/);
    expect(JSON.stringify(await page.evaluate(() => history.state))).not.toContain(question);
    await page.getByRole('button', { name: ko.auth.entry.cancel }).click();
    await expect(page.getByText(question)).toBeVisible();
    await expect(firstCheck).toHaveAttribute('aria-pressed', 'true');
    await expect(checklist.getByText('1/4 확인')).toBeVisible();
    expect(decodeURIComponent(page.url())).not.toContain(question);
    await page.reload();
    await expect(page.getByText(ko.app.ask.empty.title)).toBeVisible();
    expect(decodeURIComponent(page.url())).not.toContain(question);
  });
}
