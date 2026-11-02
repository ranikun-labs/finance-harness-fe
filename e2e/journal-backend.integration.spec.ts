import {
  expect,
  test,
  type APIRequestContext,
  type Page,
  type Request,
  type Response,
} from '@playwright/test';

import { buildAppJournalDetailPath } from '@/constants/routes';
import { ko } from '@/i18n/messages/ko';

const HARNESS_PATH = '/e2e/support/journal-backend-harness.html';
const BACKEND_B = 'http://127.0.0.1:8082';

function isCreateRequest(request: Request) {
  const url = new URL(request.url());
  return request.method() === 'POST' && url.pathname === '/finance/journals';
}

function isListResponse(response: Response) {
  const url = new URL(response.url());
  return response.request().method() === 'GET' && url.pathname === '/finance/journals';
}

function isDetailResponse(response: Response) {
  const url = new URL(response.url());
  return (
    response.request().method() === 'GET' &&
    url.pathname.startsWith('/finance/journals/') &&
    url.pathname !== '/finance/journals/'
  );
}

async function openInvestmentForm(page: Page, assetName: string) {
  await page.goto(HARNESS_PATH);
  await expect(page.getByRole('heading', { name: ko.app.journalNew.investment })).toBeVisible();
  await page.locator('#assetName').fill(assetName);
  await page.locator('#reasoning').fill('RPL-34 real FE to BE integration evidence.');
  await page.getByRole('radio', { name: ko.recordTags.action.interest }).check();
}

async function expectBackendBHasNoRecord(request: APIRequestContext, journalId: string) {
  const detail = await request.get(BACKEND_B + '/finance/journals/' + journalId);
  expect(detail.status()).toBe(404);

  const list = await request.get(BACKEND_B + '/finance/journals?limit=20');
  expect(list.status()).toBe(200);
  expect((await list.json()).items).toEqual([]);
}

test('production HTTP adapter creates through the Journal UI and reads through BE A', async ({
  page,
  request,
}) => {
  const assetName = 'RPL-34 UI create success';
  const createRequestPromise = page.waitForRequest(isCreateRequest);
  const createResponsePromise = page.waitForResponse((response) =>
    isCreateRequest(response.request()),
  );
  const detailResponsePromise = page.waitForResponse(isDetailResponse);
  const listResponsePromise = page.waitForResponse(isListResponse);

  await openInvestmentForm(page, assetName);
  await page.getByRole('button', { name: ko.app.journalNew.form.submitSave }).click();

  const createRequest = await createRequestPromise;
  expect(createRequest.headers().authorization).toBeUndefined();
  const requestBody = JSON.parse(createRequest.postData() ?? '{}');
  expect(requestBody.occurredAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
  expect(requestBody.timeZone).toBe('Asia/Seoul');

  const createResponse = await createResponsePromise;
  expect(createResponse.status()).toBe(201);
  const { journalId } = await createResponse.json();
  expect(typeof journalId).toBe('string');

  const detailResponse = await detailResponsePromise;
  expect(detailResponse.status()).toBe(200);
  expect((await detailResponse.json()).assetName).toBe(assetName);

  const listResponse = await listResponsePromise;
  expect(listResponse.status()).toBe(200);
  const listBody = await listResponse.json();
  expect(
    listBody.items.filter((item: { assetName: string }) => item.assetName === assetName),
  ).toHaveLength(1);

  await expect(page).toHaveURL((url) => url.pathname === buildAppJournalDetailPath(journalId));
  await expect(page.getByRole('heading', { level: 2, name: assetName })).toBeVisible();
  await expect(page.locator('.journal-workspace-list-pane').getByText(assetName)).toBeVisible();
  await expectBackendBHasNoRecord(request, journalId);
});

test('a lost 201 response can retry with the same key and still creates one BE A record', async ({
  page,
  request,
}) => {
  const assetName = 'RPL-34 UI create retry';
  const attempts: Array<{ key: string | undefined; status: number; journalId: string }> = [];
  let dropFirstResponse = true;

  await page.route('**/finance/journals**', async (route) => {
    const incoming = route.request();
    const url = new URL(incoming.url());
    if (!isCreateRequest(incoming) || url.pathname !== '/finance/journals') {
      await route.continue();
      return;
    }

    const upstream = await route.fetch();
    const responseBody = await upstream.body();
    const parsed = JSON.parse(responseBody.toString('utf8')) as { journalId: string };
    attempts.push({
      key: incoming.headers()['idempotency-key'],
      status: upstream.status(),
      journalId: parsed.journalId,
    });

    if (dropFirstResponse) {
      dropFirstResponse = false;
      await route.abort('failed');
      return;
    }

    await route.fulfill({ response: upstream, body: responseBody });
  });

  await openInvestmentForm(page, assetName);
  await page.getByRole('button', { name: ko.app.journalNew.form.submitSave }).click();
  await expect(page.getByText(ko.app.journalNew.form.networkError)).toBeVisible();
  await expect(page.getByRole('button', { name: ko.app.journalNew.form.retry })).toBeVisible();
  expect(attempts).toHaveLength(1);
  expect(attempts[0].status).toBe(201);
  expect(attempts[0].key).toBeTruthy();

  const createResponsePromise = page.waitForResponse((response) =>
    isCreateRequest(response.request()),
  );
  const detailResponsePromise = page.waitForResponse(isDetailResponse);
  const listResponsePromise = page.waitForResponse(isListResponse);
  await page.getByRole('button', { name: ko.app.journalNew.form.retry }).click();

  const createResponse = await createResponsePromise;
  expect(createResponse.status()).toBe(201);
  const { journalId } = await createResponse.json();
  const detailResponse = await detailResponsePromise;
  expect(detailResponse.status()).toBe(200);
  expect((await detailResponse.json()).assetName).toBe(assetName);

  const listResponse = await listResponsePromise;
  expect(listResponse.status()).toBe(200);
  const listBody = await listResponse.json();
  expect(
    listBody.items.filter((item: { assetName: string }) => item.assetName === assetName),
  ).toHaveLength(1);

  expect(attempts).toHaveLength(2);
  expect(attempts[1].status).toBe(201);
  expect(attempts[1].key).toBe(attempts[0].key);
  expect(attempts[1].journalId).toBe(attempts[0].journalId);
  expect(journalId).toBe(attempts[0].journalId);

  await expect(page).toHaveURL((url) => url.pathname === buildAppJournalDetailPath(journalId));
  await expect(page.getByRole('heading', { level: 2, name: assetName })).toBeVisible();
  await expect(page.locator('.journal-workspace-list-pane').getByText(assetName)).toBeVisible();
  await expectBackendBHasNoRecord(request, journalId);
});
