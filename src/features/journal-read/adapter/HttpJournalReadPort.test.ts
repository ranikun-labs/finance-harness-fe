import { describe, expect, it, vi } from 'vitest';

import {
  HttpJournalReadPort,
  type JournalReadFetch,
} from '@/features/journal-read/adapter/HttpJournalReadPort';

const VALID_JOURNAL_ID = '550e8400-e29b-41d4-a716-446655440000';

function responseWithJson(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const investmentDetail = {
  journalId: VALID_JOURNAL_ID,
  type: 'investment' as const,
  occurredAt: '2026-08-12T14:30:15.123',
  timeZone: 'Asia/Seoul',
  createdAt: '2026-08-12T05:31:02.123Z',
  updatedAt: '2026-08-12T05:31:02.123Z',
  assetName: 'ETF',
  action: 'buy' as const,
  reasoning: 'thesis',
  emotion: null,
};

const listResponse = {
  items: [
    {
      journalId: VALID_JOURNAL_ID,
      type: 'investment' as const,
      occurredAt: '2026-08-12T14:30:15.123',
      timeZone: 'Asia/Seoul',
      assetName: 'ETF',
      action: 'buy' as const,
    },
  ],
  nextCursor: 'opaque/cursor?1',
};

function createPort(fetchImpl: JournalReadFetch): HttpJournalReadPort {
  return new HttpJournalReadPort({ fetchImpl });
}

describe('HttpJournalReadPort', () => {
  it('reads the first page through the same-origin list endpoint', async () => {
    const fetchMock = vi.fn<JournalReadFetch>();
    fetchMock.mockResolvedValue(responseWithJson(200, listResponse));

    await expect(createPort(fetchMock).list()).resolves.toEqual({
      ok: true,
      data: listResponse,
    });

    const call = fetchMock.mock.calls[0];
    expect(call).toBeDefined();
    if (!call) throw new Error('fetch call was not recorded');
    expect(call[0]).toBe('/finance/journals?limit=20');
    expect(call[1]).toEqual({ method: 'GET', headers: { Accept: 'application/json' } });
    expect(call[1]).not.toHaveProperty('credentials');
    expect(call[1]?.headers).not.toHaveProperty('Authorization');
  });

  it('passes an opaque cursor through URL encoding without decoding or inspecting it', async () => {
    const fetchMock = vi.fn<JournalReadFetch>();
    fetchMock.mockResolvedValue(responseWithJson(200, { items: [], nextCursor: null }));

    await expect(
      createPort(fetchMock).list({ limit: 100, cursor: 'opaque/cursor?1' }),
    ).resolves.toEqual({
      ok: true,
      data: { items: [], nextCursor: null },
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      '/finance/journals?limit=100&cursor=opaque%2Fcursor%3F1',
    );
  });

  it('reads a valid detail and URL-encodes only the id path segment', async () => {
    const fetchMock = vi.fn<JournalReadFetch>();
    fetchMock.mockResolvedValue(responseWithJson(200, investmentDetail));

    await expect(createPort(fetchMock).detail('journal/1')).resolves.toEqual({
      ok: true,
      data: investmentDetail,
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/finance/journals/journal%2F1');
  });

  it.each([0, 101, 1.5])('rejects out-of-range limit %s before transport', async (limit) => {
    const fetchMock = vi.fn<JournalReadFetch>();
    const result = await createPort(fetchMock).list({ limit });
    expect(result).toEqual({ ok: false, error: { code: 'invalid_request', status: 400 } });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [400, 'invalid_request'],
    [404, 'journal_not_found'],
  ] as const)('maps detail HTTP %s to %s', async (status, code) => {
    const fetchMock = vi.fn<JournalReadFetch>();
    fetchMock.mockResolvedValue(responseWithJson(status, { error: code }));
    await expect(createPort(fetchMock).detail(VALID_JOURNAL_ID)).resolves.toEqual({
      ok: false,
      error: { code, status },
    });
  });

  it.each([401, 403, 409, 500])('maps unexpected HTTP %s to read_failed', async (status) => {
    const fetchMock = vi.fn<JournalReadFetch>();
    fetchMock.mockResolvedValue(responseWithJson(status, { error: 'backend detail' }));
    await expect(createPort(fetchMock).detail(VALID_JOURNAL_ID)).resolves.toEqual({
      ok: false,
      error: { code: 'read_failed', status },
    });
  });

  it('maps list 404 to read_failed because list has no not-found contract', async () => {
    const fetchMock = vi.fn<JournalReadFetch>();
    fetchMock.mockResolvedValue(responseWithJson(404, { error: 'journal_not_found' }));
    await expect(createPort(fetchMock).list()).resolves.toEqual({
      ok: false,
      error: { code: 'read_failed', status: 404 },
    });
  });

  it.each([
    ['invalid JSON', new Response('{invalid', { status: 200 })],
    ['null body', responseWithJson(200, null)],
    ['missing nextCursor', responseWithJson(200, { items: [] })],
    ['malformed item', responseWithJson(200, { items: [{ journalId: 'x' }], nextCursor: null })],
  ])('maps %s 2xx body to invalid_result', async (_label, response) => {
    const fetchMock = vi.fn<JournalReadFetch>();
    fetchMock.mockResolvedValue(response);
    await expect(createPort(fetchMock).list()).resolves.toEqual({
      ok: false,
      error: { code: 'invalid_result', status: 200 },
    });
  });

  it('maps network failures to read_failed without leaking the raw error', async () => {
    const fetchMock = vi.fn<JournalReadFetch>();
    fetchMock.mockRejectedValue(new Error('socket detail'));
    await expect(createPort(fetchMock).detail(VALID_JOURNAL_ID)).resolves.toEqual({
      ok: false,
      error: { code: 'read_failed' },
    });
  });
});
