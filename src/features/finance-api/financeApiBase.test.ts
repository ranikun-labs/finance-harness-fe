import { afterEach, describe, expect, it, vi } from 'vitest';

import { isFinanceJournalCreateDevEnabled } from '@/features/finance-api/devAcceptanceFlags';
import {
  DEFAULT_FINANCE_API_BASE,
  resolveFinanceApiBase,
} from '@/features/finance-api/financeApiBase';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('resolveFinanceApiBase', () => {
  it('keeps the production same-origin /finance contract when unset or blank', () => {
    expect(resolveFinanceApiBase(undefined)).toBe(DEFAULT_FINANCE_API_BASE);
    expect(resolveFinanceApiBase('')).toBe('/finance');
    expect(resolveFinanceApiBase('   ')).toBe('/finance');
  });

  it('accepts the DEV Gateway base path', () => {
    expect(resolveFinanceApiBase('/api/finance')).toBe('/api/finance');
  });

  it.each([
    'https://gateway.example.test/api/finance',
    '//evil.example.test/api/finance',
    'api/finance',
    '/api/finance/',
    '/api/../finance',
    '/',
    '/api/finance?x=1',
  ])('fails closed on a non same-origin or malformed base: %s', (value) => {
    expect(() => resolveFinanceApiBase(value)).toThrow(/same-origin absolute path/);
  });
});

describe('journal request path under the DEV base', () => {
  it('sends create, list and detail to /api/finance/journals when VITE_FINANCE_API_BASE=/api/finance', async () => {
    vi.stubEnv('VITE_FINANCE_API_BASE', '/api/finance');
    vi.resetModules();
    const [{ FINANCE_JOURNALS_PATH }, { HttpJournalCreatePort }, { HttpJournalReadPort }] =
      await Promise.all([
        import('@/features/finance-api/financeApiBase'),
        import('@/features/journal-new/adapter/HttpJournalCreatePort'),
        import('@/features/journal-read/adapter/HttpJournalReadPort'),
      ]);
    expect(FINANCE_JOURNALS_PATH).toBe('/api/finance/journals');

    const urls: string[] = [];
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      urls.push(String(input));
      const isCreate = urls.length === 1;
      return new Response(
        JSON.stringify(isCreate ? { journalId: 'j-1' } : { items: [], nextCursor: null }),
        { status: isCreate ? 201 : 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    await new HttpJournalCreatePort({ fetchImpl, timeZone: 'Asia/Seoul' }).create(
      {
        type: 'investment',
        assetName: 'Asset A',
        occurredAt: '2026-08-07T14:30',
        action: 'buy',
        reasoning: 'Reason',
        emotion: '확신',
      },
      'journal-create.test_01',
    );
    await new HttpJournalReadPort({ fetchImpl }).list({ limit: 20 });
    await new HttpJournalReadPort({ fetchImpl }).detail('11111111-1111-4111-8111-111111111111');

    expect(urls).toHaveLength(3);
    expect(urls[0]).toBe('/api/finance/journals');
    expect(urls[1]).toBe('/api/finance/journals?limit=20');
    expect(urls[2]).toBe('/api/finance/journals/11111111-1111-4111-8111-111111111111');
    expect(urls.every((url) => !url.startsWith('/finance/'))).toBe(true);
  });

  it('keeps the production /finance/journals path when the base is unset', async () => {
    vi.resetModules();
    const { FINANCE_JOURNALS_PATH } = await import('@/features/finance-api/financeApiBase');
    expect(FINANCE_JOURNALS_PATH).toBe('/finance/journals');
  });
});

describe('isFinanceJournalCreateDevEnabled', () => {
  it('is OFF by default and never effective in a production build', () => {
    expect(isFinanceJournalCreateDevEnabled(undefined, false)).toBe(false);
    expect(isFinanceJournalCreateDevEnabled('false', false)).toBe(false);
    expect(isFinanceJournalCreateDevEnabled('true', true)).toBe(false);
    expect(isFinanceJournalCreateDevEnabled('true', false)).toBe(true);
  });
});
