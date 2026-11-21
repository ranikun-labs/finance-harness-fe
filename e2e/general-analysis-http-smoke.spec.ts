import { expect, test, type Response } from '@playwright/test';
import { startReview } from './review-test-flow';

test('local generic analysis through Finance and the model double', async ({ page }, testInfo) => {
  const requests: string[] = [];
  const external: string[] = [];
  const responses: { path: string; status: number; response: Response }[] = [];
  page.on('response', (response) => {
    const path = new URL(response.url()).pathname;
    if (path.startsWith('/finance/')) {
      responses.push({ path, status: response.status(), response });
    }
  });
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin !== 'http://127.0.0.1:4178') external.push(url.origin);
    const path = url.pathname;
    if (path.startsWith('/finance/')) requests.push(`${request.method()} ${path}`);
  });
  await startReview(page, 'How do I check synthetic investment information?');
  await expect(page.getByText('Review the checklist before continuing.')).toBeVisible();
  await page.getByLabel('I reviewed the checklist').check();
  await page.getByRole('button', { name: 'Analyze', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Completed');
  await expect(page.getByText('Review current items.')).toBeVisible();
  await expect(page.getByText('Synthetic fixture only.')).toBeVisible();
  await expect(page.getByLabel('Synthetic lens')).toHaveCount(0);
  expect(external).toEqual([]);
  // Development StrictMode may rehearse the setup effect before the selected setup.
  const setup = 'POST /finance/general-analysis/questions';
  const setupRequests = requests.filter((request) => request === setup);
  expect(setupRequests.length).toBeGreaterThanOrEqual(1);
  expect(setupRequests.length).toBeLessThanOrEqual(2);
  const remaining = requests.slice(setupRequests.length);
  expect(requests.slice(0, setupRequests.length)).toEqual(setupRequests);
  expect(remaining).toHaveLength(2);
  const confirmed = remaining[0].match(
    /^PUT \/finance\/general-analysis\/questions\/([^/]+)\/checklists\/([^/]+)$/,
  );
  expect(confirmed).not.toBeNull();
  const [, questionId, checklistId] = confirmed!;
  expect(remaining[1]).toBe(`POST /finance/general-analysis/questions/${questionId}/analysis`);
  expect(
    responses.find((response) =>
      response.path.endsWith(`/questions/${questionId}/checklists/${checklistId}`),
    )?.status,
  ).toBe(200);
  const successfulSetups = responses.filter(
    (response) =>
      response.path === '/finance/general-analysis/questions' && response.status === 201,
  );
  const setupBodies = await Promise.all(
    successfulSetups.map(({ response }) => response.json().catch(() => null)),
  );
  expect(
    setupBodies.filter(
      (body) => (body as { questionId?: string } | null)?.questionId === questionId,
    ),
  ).toHaveLength(1);
  expect(
    responses.find((response) => response.path.endsWith(`/questions/${questionId}/analysis`))
      ?.status,
  ).toBe(200);
  await page.screenshot({
    path: testInfo.outputPath('finance-browser.png'),
    fullPage: true,
  });
});
