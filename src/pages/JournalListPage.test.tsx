import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/i18n/I18nContext';
import { en } from '@/i18n/messages/en';
import { ko } from '@/i18n/messages/ko';
import type { JournalReadPort } from '@/features/journal-read/model/journalReadPort';
import { JournalListPage } from '@/pages/JournalListPage';

const LIST_DATA = {
  items: [
    {
      journalId: 'journal-investment-1',
      type: 'investment' as const,
      occurredAt: '2026-08-12T14:30:15.123',
      timeZone: 'Asia/Seoul',
      assetName: 'ETF',
      action: 'buy' as const,
    },
    {
      journalId: 'journal-study-1',
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
    expect(screen.getByRole('link', { name: /질문하러 가기/ })).toBeInTheDocument();
  });
});
