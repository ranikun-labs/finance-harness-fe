import { describe, expect, it, vi } from 'vitest';

import type { InvestmentJournalCreateCommand } from '@/features/journal-new/model/journalCreateCommand';
import {
  HttpJournalCreatePort,
  type JournalFetch,
} from '@/features/journal-new/adapter/HttpJournalCreatePort';
import { createProductionJournalCreatePort } from '@/features/journal-new/adapter/productionJournalCreatePort';

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

    await expect(port.create(createInvestmentCommand())).resolves.toEqual({
      journalId: 'journal-123',
    });

    const call = fetchMock.mock.calls[0];
    expect(call).toBeDefined();
    if (!call) throw new Error('fetch call was not recorded');

    expect(call[0]).toBe('/finance/journals');
    expect(call[1]).toEqual({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

  it('returns the journal id from a canonical 201 response', async () => {
    const fetchMock = vi.fn<JournalFetch>();
    fetchMock.mockResolvedValue(responseWithJson(201, { journalId: 'opaque-id' }));

    await expect(createPort(fetchMock).create(createInvestmentCommand())).resolves.toEqual({
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

    await expect(createPort(fetchMock).create(createInvestmentCommand())).resolves.toEqual({
      journalId: '',
    });
  });

  it.each([200, 202, 206])(
    'maps contract-external %i responses to invalid_result',
    async (status) => {
      const fetchMock = vi.fn<JournalFetch>();
      fetchMock.mockResolvedValue(responseWithJson(status, { journalId: 'ignored-id' }));

      await expect(createPort(fetchMock).create(createInvestmentCommand())).resolves.toEqual({
        journalId: '',
      });
    },
  );

  it.each([400, 401, 403, 409, 422, 429, 500])(
    'maps HTTP %i to create_failed without exposing backend details',
    async (status) => {
      const fetchMock = vi.fn<JournalFetch>();
      fetchMock.mockResolvedValue(responseWithJson(status, { error: 'backend detail' }));

      await expect(createPort(fetchMock).create(createInvestmentCommand())).rejects.toThrow(
        'create_failed',
      );
    },
  );

  it('maps a network rejection to create_failed without rethrowing the raw error', async () => {
    const fetchMock = vi.fn<JournalFetch>();
    fetchMock.mockRejectedValue(new Error('socket detail'));

    await expect(createPort(fetchMock).create(createInvestmentCommand())).rejects.toThrow(
      'create_failed',
    );
  });

  it('reads runtime timezone only through the production composition seam', async () => {
    const fetchMock = vi.fn<JournalFetch>();
    fetchMock.mockResolvedValue(responseWithJson(201, { journalId: 'journal-123' }));
    const port = createProductionJournalCreatePort({ fetchImpl: fetchMock });

    await port.create(createInvestmentCommand());

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

    await port.create(createInvestmentCommand());

    const call = fetchMock.mock.calls[0];
    expect(call).toBeDefined();
    if (!call) throw new Error('fetch call was not recorded');
    expect(JSON.parse(String(call[1]?.body))).toMatchObject({
      timeZone: 'America/Los_Angeles',
    });
  });
});
