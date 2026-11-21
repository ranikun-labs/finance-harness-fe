import { expect, test } from '@playwright/test';
import { startReview } from './review-test-flow';

test('a ticker survives reopening and its filing view is explicitly synthetic', async ({
  page,
}) => {
  const blocked = await page.request.get('/finance/local-holding', {
    headers: { Host: 'attacker.example' },
  });
  expect(blocked.status()).toBe(403);
  await page.route('**/finance/local-fake-analysis/questions', (route) =>
    route.fulfill({
      json: { questionId: 'q', checklistId: 'c', checklistItems: [{ id: 'i', prompt: 'Review' }] },
    }),
  );
  await startReview(page, 'How do I review an investment?');
  await expect(page.getByRole('button', { name: 'Save ticker' })).toBeEnabled();
  await page.getByLabel('Ticker').fill('aapl');
  await page.getByRole('button', { name: 'Save ticker' }).click();
  await expect(page.getByLabel('Saved holding')).toContainText('AAPL');
  await page.reload();
  await startReview(page, 'How do I review an investment?');
  await expect(page.getByLabel('Saved holding')).toContainText('AAPL');
  await page.getByRole('button', { name: 'View filing example' }).click();
  await expect(page.getByLabel('Filing example')).toContainText('not an official filing');
  await expect(page.getByLabel('Filing example')).toContainText('local-synthetic-fixture:v1');
  if (process.env.FINANCE_HOLDING_SCREENSHOT) {
    await page.screenshot({ path: process.env.FINANCE_HOLDING_SCREENSHOT, fullPage: true });
  }
});
