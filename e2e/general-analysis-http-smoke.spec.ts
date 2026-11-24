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

test('reference sign-out hides a pending analysis and its checklist', async ({ page }) => {
  test.skip(
    process.env.VITE_FINANCE_REFERENCE_AUTH_ENABLED !== 'true',
    'Requires explicit reference login opt-in',
  );
  await page.route('**/api/v1/auth/finance-reference/login', (route) =>
    route.fulfill({
      json: {
        status: 200,
        message: 'ok',
        data: {
          accessToken: 'public-reference-fixture-token',
          tokenType: 'Bearer',
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
        },
      },
    }),
  );
  await page.route('**/finance/general-analysis/questions', (route) =>
    route.fulfill({
      status: 201,
      json: {
        questionId: 'test-question',
        checklistId: 'test-checklist',
        checklistItems: [{ id: 'known_facts', prompt: 'Private checklist fixture' }],
      },
    }),
  );
  await page.route('**/finance/general-analysis/questions/*/checklists/*', (route) =>
    route.fulfill({ json: { confirmed: true, revision: 1 } }),
  );
  await page.goto('/auth');
  await page.locator('input[autocomplete=username]').fill('fixture-user');
  await page.locator('input[autocomplete=current-password]').fill('fixture-password');
  await page.getByTestId('finance-reference-login').click();
  await expect(page.getByTestId('finance-reference-session')).toBeVisible();

  // Keep the in-memory session by navigating through the app instead of reloading it.
  await page.locator('a[href="/app"]').first().click();
  const field = page.locator('#review-question');
  await field.fill('How can I check these facts?');
  await field.press('Control+Enter');
  await expect(page.getByText('Private checklist fixture')).toBeVisible();

  let release!: () => void;
  const holdResponse = new Promise<void>((resolve) => {
    release = resolve;
  });
  let markResponseAttempted!: () => void;
  const responseAttempted = new Promise<void>((resolve) => {
    markResponseAttempted = resolve;
  });
  const requestArrived = page.waitForRequest('**/finance/general-analysis/questions/*/analysis');
  await page.route('**/finance/general-analysis/questions/*/analysis', async (route) => {
    await holdResponse;
    // The app may abort transport on logout. Still attempt the late delivery.
    try {
      await route.fulfill({
        json: {
          status: 'COMPLETED',
          analysisId: 'test-analysis',
          output: {
            summary: 'Late private analysis fixture',
            observations: ['observed'],
            assumptions: ['assumed'],
            nextChecks: ['check'],
            evidenceNote: 'synthetic fixture',
          },
        },
      });
    } finally {
      markResponseAttempted();
    }
  });
  await page.getByLabel('I reviewed the checklist').check();
  await page.getByRole('button', { name: 'Analyze', exact: true }).click();
  await requestArrived;
  try {
    await page.getByRole('button', { name: /Sign out locally/ }).click();
    await expect(page.getByText('Private checklist fixture')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Analyze', exact: true })).toHaveCount(0);
  } finally {
    release();
  }
  await responseAttempted;
  await expect(page.getByText('Late private analysis fixture')).toHaveCount(0);
  await expect(page.getByText('Private checklist fixture')).toHaveCount(0);
});
