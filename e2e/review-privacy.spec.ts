import { expect, test } from '@playwright/test';
import { ko } from '@/i18n/messages/ko';
import { startReview } from './review-test-flow';

test('keeps a question out of URL and browser history through auth cancel and reload', async ({
  page,
}) => {
  const question = 'private review question 726';
  await startReview(page, question);
  await expect(page.getByText(question)).toBeVisible();
  const resultUrl = page.url();
  expect(resultUrl).not.toContain(question);
  expect(decodeURIComponent(resultUrl)).not.toContain(question);
  expect(JSON.stringify(await page.evaluate(() => history.state))).not.toContain(question);
  await page.getByRole('link', { name: new RegExp(ko.app.ask.handoff.study.title) }).click();
  await expect(page).toHaveURL(/\/auth/);
  expect(JSON.stringify(await page.evaluate(() => history.state))).not.toContain(question);
  await page.getByRole('button', { name: ko.auth.entry.cancel }).click();
  await expect(page.getByText(question)).toBeVisible();
  expect(decodeURIComponent(page.url())).not.toContain(question);
  await page.reload();
  await expect(page.getByText(ko.app.ask.empty.title)).toBeVisible();
  expect(decodeURIComponent(page.url())).not.toContain(question);
});
