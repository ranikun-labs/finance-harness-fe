import { expect, type Page } from '@playwright/test';

/** Start the review through the UI so the question never enters a URL. */
export async function startReview(page: Page, question: string) {
  await page.goto('/app');
  const field = page.locator('#review-question');
  await field.fill(question);
  await field.press('Control+Enter');
  await expect(page).toHaveURL(/\/app\/ask\?ref=/);
}
