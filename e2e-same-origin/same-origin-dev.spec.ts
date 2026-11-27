import { expect, test, type Page } from '@playwright/test';

import { buildAppJournalDetailPath } from '@/constants/routes';
import { ko } from '@/i18n/messages/ko';

import { handleDevEdgeRequest, type DevEdgeEnv } from '../worker/src/dev-edge';
import { createMockGateway } from './mock-gateway';

// Requests reach the Worker handler through Playwright's route interception, so the same code
// the DEV edge runs answers the page. The Gateway behind it is the in-memory mock.
const GATEWAY_ORIGIN = 'https://gateway.dev.example.test';
const PASSWORD = 'correct-horse-1';

type Gateway = ReturnType<typeof createMockGateway>;

async function routeApiThroughEdge(page: Page, env: DevEdgeEnv, gateway: Gateway) {
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const postData = request.postDataBuffer();
    const response = await handleDevEdgeRequest(
      new Request(request.url(), {
        method: request.method(),
        headers: await request.allHeaders(),
        body: postData ? new Uint8Array(postData) : undefined,
      }),
      env,
      gateway.fetch,
    );
    await route.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: Buffer.from(await response.arrayBuffer()),
    });
  });
}

/** Records the bearer the app itself sends, so the test can check storage never holds it. */
function recordBearers(page: Page): string[] {
  const bearers: string[] = [];
  page.on('request', (request) => {
    const value = request.headers().authorization;
    if (value?.startsWith('Bearer ')) bearers.push(value.slice('Bearer '.length));
  });
  return bearers;
}

/**
 * Client-side navigation. A full `page.goto` reloads the page and drops the in-memory session,
 * so in-app routes are reached through the router's popstate listener instead.
 */
async function navigateInApp(page: Page, path: string) {
  await page.evaluate((target) => {
    window.history.pushState(null, '', target);
    window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
  }, path);
  await expect(page).toHaveURL((url) => url.pathname === path);
}

async function signup(page: Page, email: string) {
  await page.goto('/auth');
  const form = page.getByTestId('finance-reference-signup');
  await form.locator('input[type="email"]').fill(email);
  await form.locator('input[type="password"]').fill(PASSWORD);
  await page.getByTestId('finance-reference-signup-submit').click();
  await expect(page.getByTestId('finance-reference-signup-message')).toContainText(
    '가입 요청을 처리했습니다',
  );
}

async function login(page: Page, email: string) {
  const form = page.locator('form').filter({ has: page.getByTestId('finance-reference-login') });
  await form.locator('input[autocomplete="username"]').fill(email);
  await form.locator('input[autocomplete="current-password"]').fill(PASSWORD);
  await page.getByTestId('finance-reference-login').click();
  await expect(page.getByTestId('finance-reference-session')).toBeVisible();
}

async function logoutLocally(page: Page) {
  await page
    .getByTestId('finance-reference-session')
    .getByRole('button', { name: /이 탭에서 로그아웃/ })
    .click();
  await expect(page.getByTestId('finance-reference-session')).toHaveCount(0);
}

/** Same-origin fetch from the page, so every call goes through the edge and the mock. */
async function pageFetch(
  page: Page,
  path: string,
  init: { method?: string; body?: unknown; authorization?: string } = {},
) {
  return page.evaluate(
    async ({ requestPath, method, body, authorization }) => {
      const headers: Record<string, string> = {};
      if (body !== undefined) headers['content-type'] = 'application/json';
      if (authorization) headers.authorization = authorization;
      const response = await fetch(requestPath, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return {
        status: response.status,
        contentType: response.headers.get('content-type'),
        text: await response.text(),
      };
    },
    {
      requestPath: path,
      method: init.method ?? 'GET',
      body: init.body,
      authorization: init.authorization,
    },
  );
}

test('reference signup, login, save, reload, re-login, logout and cross-account denial work through the same-origin edge', async ({
  page,
  baseURL,
}) => {
  const origin = new URL(baseURL!).origin;
  const gateway = createMockGateway();
  await routeApiThroughEdge(page, { GATEWAY_ORIGIN, PUBLIC_ORIGIN: origin }, gateway);
  const bearers = recordBearers(page);

  const stamp = Date.now();
  const firstEmail = `finance-a-${stamp}@example.test`;
  const secondEmail = `finance-b-${stamp}@example.test`;
  const assetName = `E2E 자산 ${stamp}`;

  // 1. DEV signup creates the account. It does not log in by itself.
  await signup(page, firstEmail);

  // 2. Password login. The access token lives in memory only.
  await login(page, firstEmail);

  // 3. Save a journal through the production HTTP adapter (same-origin, via the edge).
  await navigateInApp(page, '/app/journal/new');
  await page.locator('a[href="/app/journal/new?type=investment"]').click();
  await page.locator('#assetName').fill(assetName);
  await page.locator('#reasoning').fill('same-origin e2e reasoning');
  await page
    .getByRole('radio', { name: ko.recordTags.action.interest })
    .locator('xpath=..')
    .click();
  await page.getByRole('button', { name: ko.app.journalNew.form.submitSave }).click();
  await expect(page.getByRole('heading', { level: 2, name: assetName })).toBeVisible();
  const journalPath = new URL(page.url()).pathname;
  const journalId = journalPath.split('/').pop() ?? '';
  expect(journalPath).toBe(buildAppJournalDetailPath(journalId));

  // The app's own bearer never reaches browser storage.
  const ownBearer = bearers.at(-1);
  expect(ownBearer).toBeTruthy();
  expect(
    await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage })),
  ).not.toContain(ownBearer!);

  // 4. Reload loses the in-memory session. Re-login reaches the same journal.
  await page.reload();
  await expect(page.getByTestId('finance-reference-session')).toHaveCount(0);
  await login(page, firstEmail);
  await navigateInApp(page, journalPath);
  await expect(page.getByRole('heading', { level: 2, name: assetName })).toBeVisible();

  // 5. Logout clears the session. The journal is then unreadable without a token.
  await logoutLocally(page);
  const anonymous = await pageFetch(page, `/api/finance/journals/${journalId}`);
  expect(anonymous.status).toBe(401);
  expect(JSON.parse(anonymous.text)).toEqual({ status: 401, message: 'Unauthorized.' });

  // 6. A second account signs up and logs in, then cannot read the first account's journal.
  await signup(page, secondEmail);
  const secondLogin = await pageFetch(page, '/api/v1/auth/finance-reference/login', {
    method: 'POST',
    body: { userId: secondEmail, password: PASSWORD },
  });
  expect(secondLogin.status).toBe(200);
  const secondToken = JSON.parse(secondLogin.text).data.accessToken as string;
  expect(secondToken).toMatch(/^fat-/);

  const denied = await pageFetch(page, `/api/finance/journals/${journalId}`, {
    authorization: `Bearer ${secondToken}`,
  });
  expect(denied.status).toBe(404);
  expect(denied.text).not.toContain(assetName);

  const secondList = await pageFetch(page, '/api/finance/journals?limit=20', {
    authorization: `Bearer ${secondToken}`,
  });
  expect(secondList.status).toBe(200);
  expect(secondList.text).not.toContain(assetName);

  // The first account still reads its own journal with its own token.
  const ownRead = await pageFetch(page, `/api/finance/journals/${journalId}`, {
    authorization: `Bearer ${ownBearer}`,
  });
  expect(ownRead.status).toBe(200);
  expect(JSON.parse(ownRead.text).assetName).toBe(assetName);

  // 7. Unknown and malformed API paths answer with JSON from the edge, never HTML.
  const unknown = await pageFetch(page, '/api/finance/not-a-route');
  expect(unknown.status).toBe(404);
  expect(unknown.contentType).toContain('application/json');
  expect(unknown.text).not.toMatch(/<!doctype|<html/i);

  const encoded = await pageFetch(page, '/api/finance/journals%2fx');
  expect(encoded.status).toBe(400);
  expect(JSON.parse(encoded.text)).toEqual({ status: 400, message: 'Invalid request path.' });

  expect(gateway.requestLog).toContain('POST /api/v1/auth/finance-reference/signup');
  expect(gateway.requestLog).toContain('POST /api/v1/auth/finance-reference/login');
});
