import { describe, expect, it, vi } from 'vitest';

import type { InvestmentJournalCreateCommand } from '@/features/journal-new/model/journalCreateCommand';
import {
  HttpJournalCreatePort,
  type JournalFetch,
} from '@/features/journal-new/adapter/HttpJournalCreatePort';
import { JournalCreatePortError } from '@/features/journal-new/model/journalCreatePort';
import { createProductionJournalCreatePort } from '@/features/journal-new/adapter/productionJournalCreatePort';

const IDEMPOTENCY_KEY = 'journal-create.test_01';

function createInvestmentCommand(): InvestmentJournalCreateCommand {
  return {
    type: 'investment',
    assetName: 'Asset A',
    occurredAt: '2026-08-07T14:30',
    action: 'buy',
    reasoning: 'Reason',
    emotion: '확신',
  };
}

function responseWithJson(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function createPort(fetchImpl: JournalFetch): HttpJournalCreatePort {
  return new HttpJournalCreatePort({ fetchImpl, timeZone: 'Asia/Seoul' });
}

describe('HttpJournalCreatePort', () => {
  it('posts the exact same-origin request without credentials or authorization', async () => {
    const fetchMock = vi.fn<JournalFetch>();
    fetchMock.mockResolvedValue(responseWithJson(201, { journalId: 'journal-123' }));
    const port = createPort(fetchMock);

    await expect(port.create(createInvestmentCommand(), IDEMPOTENCY_KEY)).resolves.toEqual({
      journalId: 'journal-123',
    });

    const call = fetchMock.mock.calls[0];
    expect(call).toBeDefined();
    if (!call) throw new Error('fetch call was not recorded');

    expect(call[0]).toBe('/finance/journals');
    expect(call[1]).toEqual({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': IDEMPOTENCY_KEY,
      },
      body: JSON.stringify({
        type: 'investment',
        assetName: 'Asset A',
        occurredAt: '2026-08-07T14:30',
        timeZone: 'Asia/Seoul',
        action: 'buy',
        reasoning: 'Reason',
        emotion: '확신',
      }),
    });
    expect(call[1]).not.toHaveProperty('credentials');
    expect(call[1]?.headers).not.toHaveProperty('Authorization');
  });

  it.each(['', '-leading', 'has space', 'journal-create.test_01\n', 'a'.repeat(129)])(
    'rejects an Idempotency-Key outside the backend validator contract: %j',
    async (key) => {
      const fetchMock = vi.fn<JournalFetch>();

      await expect(
        createPort(fetchMock).create(createInvestmentCommand(), key),
      ).rejects.toMatchObject({ code: 'invalid_request' });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it('returns the journal id from a canonical 201 response', async () => {
    const fetchMock = vi.fn<JournalFetch>();
    fetchMock.mockResolvedValue(responseWithJson(201, { journalId: 'opaque-id' }));

    await expect(
      createPort(fetchMock).create(createInvestmentCommand(), IDEMPOTENCY_KEY),
    ).resolves.toEqual({
      journalId: 'opaque-id',
    });
  });

  const malformedResponses: Array<[string, Response]> = [
    [
      'invalid JSON',
      new Response('{invalid-json', {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    ],
    ['null body', responseWithJson(201, null)],
    ['empty object', responseWithJson(201, {})],
    ['missing journalId', responseWithJson(201, { id: 'wrong-field' })],
    ['null journalId', responseWithJson(201, { journalId: null })],
    ['numeric journalId', responseWithJson(201, { journalId: 123 })],
    ['empty journalId', responseWithJson(201, { journalId: '' })],
    ['whitespace journalId', responseWithJson(201, { journalId: '   ' })],
  ];

  it.each(malformedResponses)('maps %s to an invalid-result sentinel', async (_label, response) => {
    const fetchMock = vi.fn<JournalFetch>();
    fetchMock.mockResolvedValue(response);

    await expect(
      createPort(fetchMock).create(createInvestmentCommand(), IDEMPOTENCY_KEY),
    ).resolves.toEqual({
      journalId: '',
    });
  });

  it.each([200, 202, 206])(
    'maps contract-external %i responses to invalid_result',
    async (status) => {
      const fetchMock = vi.fn<JournalFetch>();
      fetchMock.mockResolvedValue(responseWithJson(status, { journalId: 'ignored-id' }));

      await expect(
        createPort(fetchMock).create(createInvestmentCommand(), IDEMPOTENCY_KEY),
      ).resolves.toEqual({ journalId: '' });
    },
  );

  it.each([
    [400, 'invalid_request'],
    [409, 'idempotency_conflict'],
  ] as const)('maps HTTP %i to its safe contract error', async (status, code) => {
    const fetchMock = vi.fn<JournalFetch>();
    fetchMock.mockResolvedValue(responseWithJson(status, { message: 'private backend detail' }));

    await expect(
      createPort(fetchMock).create(createInvestmentCommand(), IDEMPOTENCY_KEY),
    ).rejects.toMatchObject({ code, message: code });
  });

  it.each([401, 403, 422, 429, 500])(
    'maps HTTP %i to create_failed without exposing backend details',
    async (status) => {
      const fetchMock = vi.fn<JournalFetch>();
      fetchMock.mockResolvedValue(responseWithJson(status, { error: 'backend detail' }));

      await expect(
        createPort(fetchMock).create(createInvestmentCommand(), IDEMPOTENCY_KEY),
      ).rejects.toThrow('create_failed');
    },
  );

  it('maps a network rejection without rethrowing the raw error', async () => {
    const fetchMock = vi.fn<JournalFetch>();
    fetchMock.mockRejectedValue(new Error('socket detail'));

    await expect(
      createPort(fetchMock).create(createInvestmentCommand(), IDEMPOTENCY_KEY),
    ).rejects.toMatchObject({ code: 'network_error', message: 'network_error' });
  });

  it('keeps the supplied key on every HTTP attempt for the same submission', async () => {
    const fetchMock = vi.fn<JournalFetch>();
    fetchMock
      .mockRejectedValueOnce(new Error('connection dropped'))
      .mockResolvedValueOnce(responseWithJson(201, { journalId: 'journal-123' }));
    const port = createPort(fetchMock);

    await expect(port.create(createInvestmentCommand(), IDEMPOTENCY_KEY)).rejects.toBeInstanceOf(
      JournalCreatePortError,
    );
    await expect(port.create(createInvestmentCommand(), IDEMPOTENCY_KEY)).resolves.toEqual({
      journalId: 'journal-123',
    });

    expect(fetchMock.mock.calls.map(([, init]) => init?.headers)).toEqual([
      { 'Content-Type': 'application/json', 'Idempotency-Key': IDEMPOTENCY_KEY },
      { 'Content-Type': 'application/json', 'Idempotency-Key': IDEMPOTENCY_KEY },
    ]);
  });

  it('reads runtime timezone only through the production composition seam', async () => {
    const fetchMock = vi.fn<JournalFetch>();
    fetchMock.mockResolvedValue(responseWithJson(201, { journalId: 'journal-123' }));
    const port = createProductionJournalCreatePort({ fetchImpl: fetchMock });

    await port.create(createInvestmentCommand(), IDEMPOTENCY_KEY);

    const call = fetchMock.mock.calls[0];
    expect(call).toBeDefined();
    if (!call) throw new Error('fetch call was not recorded');
    expect(JSON.parse(String(call[1]?.body))).toMatchObject({
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  });

  it('allows tests and future composition to provide a deterministic timezone', async () => {
    const fetchMock = vi.fn<JournalFetch>();
    fetchMock.mockResolvedValue(responseWithJson(201, { journalId: 'journal-123' }));
    const port = createProductionJournalCreatePort({
      fetchImpl: fetchMock,
      timeZone: 'America/Los_Angeles',
    });

    await port.create(createInvestmentCommand(), IDEMPOTENCY_KEY);

    const call = fetchMock.mock.calls[0];
    expect(call).toBeDefined();
    if (!call) throw new Error('fetch call was not recorded');
    expect(JSON.parse(String(call[1]?.body))).toMatchObject({
      timeZone: 'America/Los_Angeles',
    });
  });
});
