import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AppRouter } from '@/app/AppRouter';
import {
  APP_ROUTE_PATHS,
  buildAppJournalDetailPath,
  buildAppJournalNewPath,
} from '@/constants/routes';
import { createProductionJournalCreatePort } from '@/features/journal-new/adapter/productionJournalCreatePort';
import type { JournalFetch } from '@/features/journal-new/adapter/HttpJournalCreatePort';
import { createProductionJournalReadPort } from '@/features/journal-read/adapter/productionJournalReadPort';
import { ko } from '@/i18n/messages/ko';

const JOURNAL_ID = 'a3a51775-7c17-4d9a-9d12-5ea89a46bc06';
const JOURNAL_DETAIL = {
  journalId: JOURNAL_ID,
  type: 'investment',
  occurredAt: '2026-08-03T09:30:00.000',
  timeZone: 'Asia/Seoul',
  createdAt: '2026-08-03T00:30:00.000Z',
  updatedAt: '2026-08-03T00:30:00.000Z',
  assetName: '산업 ETF',
  action: 'interest',
  reasoning: '수요와 현금 흐름을 검토했다.',
  emotion: null,
};

function RoutePathProbe() {
  const { pathname, search } = useLocation();
  return <output data-testid="route-path">{`${pathname}${search}`}</output>;
}

describe('opt-in Journal Create route integration (mocked HTTP)', () => {
  it('keeps the production save affordance off when AppRouter has no opted-in port', async () => {
    render(
      <MemoryRouter initialEntries={[buildAppJournalNewPath('investment')]}>
        <AppRouter />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('button', { name: ko.app.journalNew.form.checkEntries }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ko.app.journalNew.form.submitSave })).toBeNull();
    expect(screen.queryByText(ko.app.journalNew.form.saveFlowNotice)).toBeNull();
  });

  it('saves through the existing adapter, opens the returned ID, and reads it in detail and list', async () => {
    const requests: Array<{ url: string; method: string; body?: string }> = [];
    const fetchImpl: JournalFetch = async (input, init) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      requests.push({ url, method, body: typeof init?.body === 'string' ? init.body : undefined });

      if (method === 'POST' && url === '/finance/journals') {
        return new Response(JSON.stringify({ journalId: JOURNAL_ID }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (method === 'GET' && url.startsWith('/finance/journals?')) {
        return new Response(
          JSON.stringify({
            items: [
              {
                journalId: JOURNAL_ID,
                type: 'investment',
                occurredAt: JOURNAL_DETAIL.occurredAt,
                timeZone: JOURNAL_DETAIL.timeZone,
                assetName: JOURNAL_DETAIL.assetName,
                action: JOURNAL_DETAIL.action,
              },
            ],
            nextCursor: null,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (method === 'GET' && url === `/finance/journals/${JOURNAL_ID}`) {
        return new Response(JSON.stringify(JOURNAL_DETAIL), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('{}', { status: 404 });
    };

    render(
      <MemoryRouter initialEntries={[buildAppJournalNewPath('investment')]}>
        <RoutePathProbe />
        <AppRouter
          authPresentation={{ state: 'authenticated' }}
          journalCreatePort={createProductionJournalCreatePort({
            fetchImpl,
            timeZone: 'Asia/Seoul',
          })}
          journalCreateMode="production"
          journalReadPort={createProductionJournalReadPort({ fetchImpl })}
        />
      </MemoryRouter>,
    );

    await screen.findByLabelText('대상');
    fireEvent.change(screen.getByLabelText('대상'), { target: { value: '산업 ETF' } });
    fireEvent.click(screen.getByLabelText('관심'));
    fireEvent.change(screen.getByLabelText('왜 그렇게 판단했나요?'), {
      target: { value: '수요와 현금 흐름을 검토했다.' },
    });
    fireEvent.click(screen.getByRole('button', { name: '기록 시점 변경' }));
    fireEvent.change(screen.getByLabelText('기록 시점'), {
      target: { value: '2026-08-03T09:30' },
    });
    expect(screen.getByRole('button', { name: '기록 저장' })).toBeInTheDocument();
    expect(screen.getByText(ko.app.journalNew.form.saveFlowNotice)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '기록 저장' }));

    expect(await screen.findByText('수요와 현금 흐름을 검토했다.')).toBeInTheDocument();
    const workspace = await screen.findByTestId('journal-workspace');
    const listPane = within(workspace);
    const listRecord = await listPane.findByRole('link', { name: /산업 ETF/ });
    expect(listRecord).toHaveAttribute('href', buildAppJournalDetailPath(JOURNAL_ID));
    expect(requests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: '/finance/journals', method: 'POST' }),
        expect.objectContaining({ url: `/finance/journals/${JOURNAL_ID}`, method: 'GET' }),
        expect.objectContaining({
          url: expect.stringMatching(/^\/finance\/journals\?limit=/),
          method: 'GET',
        }),
      ]),
    );
    expect(
      JSON.parse(requests.find((request) => request.method === 'POST')?.body ?? '{}'),
    ).toMatchObject({ assetName: '산업 ETF', action: 'interest' });

    fireEvent.click(screen.getByRole('link', { name: ko.app.journalDetail.backLabel }));
    await waitFor(() =>
      expect(screen.getByTestId('route-path')).toHaveTextContent(APP_ROUTE_PATHS.journalList),
    );
    expect(await screen.findByRole('link', { name: /산업 ETF/ })).toHaveAttribute(
      'href',
      buildAppJournalDetailPath(JOURNAL_ID),
    );
  });
});
