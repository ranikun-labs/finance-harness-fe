import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { APP_ROUTE_PATHS, AUTH_ROUTE_PATHS } from '@/constants/routes';
import { I18nProvider } from '@/i18n/I18nContext';
import { en } from '@/i18n/messages/en';
import { ko } from '@/i18n/messages/ko';
import type { JournalReadPort } from '@/features/journal-read/model/journalReadPort';
import { JournalListPage } from '@/pages/JournalListPage';

const PRIMARY_INVESTMENT_ID = '550e8400-e29b-41d4-a716-446655440000';
const STUDY_ID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

const LIST_DATA = {
  items: [
    {
      journalId: PRIMARY_INVESTMENT_ID,
      type: 'investment' as const,
      occurredAt: '2026-08-12T14:30:15.123',
      timeZone: 'Asia/Seoul',
      assetName: 'ETF',
      action: 'buy' as const,
    },
    {
      journalId: STUDY_ID,
      type: 'study' as const,
      occurredAt: '2026-08-12T14:30:00.000',
      timeZone: 'Asia/Seoul',
      title: 'Study',
    },
  ],
  nextCursor: null,
};

function renderPage(locale: 'ko' | 'en', readPort: JournalReadPort) {
  return render(
    <MemoryRouter>
      <I18nProvider locale={locale}>
        <JournalListPage readPort={readPort} />
      </I18nProvider>
    </MemoryRouter>,
  );
}

function successfulPort(): JournalReadPort {
  return {
    list: vi.fn().mockResolvedValue({ ok: true, data: LIST_DATA }),
    detail: vi.fn(),
  };
}

describe('JournalListPage', () => {
  it('renders the ko heading and canonical summary data after the initial load', async () => {
    const readPort = successfulPort();
    renderPage('ko', readPort);

    expect(
      screen.getByRole('heading', { level: 1, name: ko.app.journalList.title }),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('ETF')).toBeInTheDocument());
    expect(screen.getByText('Study')).toBeInTheDocument();
    expect(readPort.list).toHaveBeenCalledWith(expect.objectContaining({ limit: 20 }));
  });

  it('renders English labels while preserving server-owned content', async () => {
    renderPage('en', successfulPort());
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: en.app.journalList.title }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText('ETF')).toBeInTheDocument();
    expect(screen.getByText(en.recordTags.entryType.investment)).toBeInTheDocument();
  });

  it('renders server empty and retryable transport errors distinctly', async () => {
    const list = vi
      .fn<JournalReadPort['list']>()
      .mockResolvedValueOnce({ ok: true, data: { items: [], nextCursor: null } })
      .mockResolvedValueOnce({ ok: true, data: LIST_DATA });
    const readPort: JournalReadPort = { list, detail: vi.fn() };
    renderPage('ko', readPort);

    await waitFor(() =>
      expect(screen.getByText(ko.app.journalList.emptyAll.title)).toBeInTheDocument(),
    );
    expect(screen.getByRole('link', { name: '첫 기록 남기기' })).toHaveAttribute(
      'href',
      APP_ROUTE_PATHS.journalNew,
    );
    expect(
      screen.queryByRole('link', { name: ko.app.journalList.newRecord }),
    ).not.toBeInTheDocument();
  });
  it('keeps a nonterminal empty page distinct and retries a failed continuation', async () => {
    const list = vi
      .fn<JournalReadPort['list']>()
      .mockResolvedValueOnce({ ok: true, data: { items: [], nextCursor: 'next' } })
      .mockResolvedValueOnce({ ok: false, error: { code: 'read_failed' } })
      .mockResolvedValueOnce({ ok: true, data: LIST_DATA });
    renderPage('ko', { list, detail: vi.fn() });

    await screen.findByText(ko.app.journalList.emptyPage);
    expect(screen.queryByText(ko.app.journalList.emptyAll.title)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: ko.app.journalList.newRecord })).toHaveAttribute(
      'href',
      APP_ROUTE_PATHS.journalNew,
    );
    fireEvent.click(screen.getByRole('button', { name: ko.app.journalList.loadMore }));
    await screen.findByText(ko.app.journalList.loadMoreError.title);
    expect(
      screen.queryByRole('button', { name: ko.app.journalList.loadMore }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: ko.app.journalList.loadMoreError.retry }));
    await screen.findByText('ETF');
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: 'next' }));
  });
  it('offers sign-in when the initial list returns HTTP 401', async () => {
    const list = vi.fn<JournalReadPort['list']>().mockResolvedValue({
      ok: false,
      error: { code: 'read_failed', status: 401 },
    });
    renderPage('ko', { list, detail: vi.fn() });

    expect(
      await screen.findByRole('link', { name: ko.app.journalList.signInRequired.action }),
    ).toHaveAttribute('href', AUTH_ROUTE_PATHS.entry);
    expect(screen.queryByRole('button', { name: ko.app.journalList.error.retry })).toBeNull();
    expect(screen.queryByText(ko.app.journalList.emptyAll.title)).toBeNull();
  });

  it.each([403, 500])(
    'shows read failure for HTTP %i rather than an empty journal, and retries',
    async (status) => {
      const list = vi
        .fn<JournalReadPort['list']>()
        .mockResolvedValueOnce({ ok: false, error: { code: 'read_failed', status } })
        .mockResolvedValueOnce({ ok: true, data: LIST_DATA });
      renderPage('ko', { list, detail: vi.fn() });
      await screen.findByText(ko.app.journalList.error.title);
      expect(screen.queryByText(ko.app.journalList.emptyAll.title)).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: ko.app.journalList.backToReview })).toHaveAttribute(
        'href',
        APP_ROUTE_PATHS.appHome,
      );
      fireEvent.click(screen.getByRole('button', { name: ko.app.journalList.error.retry }));
      await screen.findByText('ETF');
      expect(list).toHaveBeenCalledTimes(2);
    },
  );
});
