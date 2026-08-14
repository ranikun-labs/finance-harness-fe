import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import {
  APP_ROUTE_PATHS,
  buildAppJournalDetailPath,
  buildAppJournalReviewPath,
} from '@/constants/routes';
import { I18nProvider } from '@/i18n/I18nContext';
import { en } from '@/i18n/messages/en';
import { ko } from '@/i18n/messages/ko';
import type { JournalReadPort } from '@/features/journal-read/model/journalReadPort';
import { JournalDetailPage } from '@/pages/JournalDetailPage';

const PRIMARY_INVESTMENT_ID = '550e8400-e29b-41d4-a716-446655440000';
const STUDY_ID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

const INVESTMENT_DETAIL = {
  journalId: PRIMARY_INVESTMENT_ID,
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

const STUDY_DETAIL = {
  journalId: STUDY_ID,
  type: 'study' as const,
  occurredAt: '2026-08-12T14:30:00.000',
  timeZone: 'Asia/Seoul',
  createdAt: '2026-08-12T05:31:02.123Z',
  updatedAt: '2026-08-12T05:31:02.123Z',
  title: 'Study',
  keyContent: 'content',
  openQuestions: ['first', 'same', 'same', 'last'],
};

function renderPage(path: string, readPort: JournalReadPort, locale: 'ko' | 'en' = 'ko') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <I18nProvider locale={locale}>
        <Routes>
          <Route
            path={APP_ROUTE_PATHS.journalDetail}
            element={<JournalDetailPage readPort={readPort} />}
          />
        </Routes>
      </I18nProvider>
    </MemoryRouter>,
  );
}

function successfulPort(detail: typeof INVESTMENT_DETAIL | typeof STUDY_DETAIL): JournalReadPort {
  return {
    list: vi.fn(),
    detail: vi.fn().mockResolvedValue({ ok: true, data: detail }),
  };
}

describe('JournalDetailPage', () => {
  it('renders an investment detail through the canonical fields only', async () => {
    renderPage(buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID), successfulPort(INVESTMENT_DETAIL));

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: 'ETF' })).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('heading', { level: 1, name: ko.app.journalDetail.headerTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText('thesis')).toBeInTheDocument();
    expect(screen.getByText('Asia/Seoul')).toBeInTheDocument();
    expect(screen.getAllByText(INVESTMENT_DETAIL.createdAt)).toHaveLength(2);
    expect(screen.getAllByText(INVESTMENT_DETAIL.updatedAt)).toHaveLength(2);
    expect(
      screen.queryByText(ko.app.journalDetail.investment.aiChecklistHeading),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(ko.app.journalDetail.decisionContext.heading),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(ko.app.journalDetail.investment.questionHeading),
    ).not.toBeInTheDocument();

    const occurredAt = screen.getAllByRole('time')[0];
    expect(occurredAt).toHaveAttribute('datetime', INVESTMENT_DETAIL.occurredAt);
  });

  it('renders study openQuestions in backend order with duplicates preserved', async () => {
    renderPage(buildAppJournalDetailPath(STUDY_ID), successfulPort(STUDY_DETAIL));

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: 'Study' })).toBeInTheDocument(),
    );
    expect(screen.getByText('content')).toBeInTheDocument();
    const list = screen.getByRole('list');
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['first', 'same', 'same', 'last']);
    expect(screen.queryByText(ko.app.journalDetail.metadata.pastAction)).not.toBeInTheDocument();
    expect(screen.queryByText(ko.app.journalDetail.metadata.pastEmotion)).not.toBeInTheDocument();
  });

  it('renders matching English labels while preserving server content', async () => {
    renderPage(
      buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID),
      successfulPort(INVESTMENT_DETAIL),
      'en',
    );

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: en.app.journalDetail.headerTitle }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole('heading', { level: 2, name: 'ETF' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: en.app.journalDetail.investment.reasoningHeading }),
    ).toBeInTheDocument();
  });

  it('maps 404 to the detail not-found state and keeps the requested id out of the UI', async () => {
    const readPort: JournalReadPort = {
      list: vi.fn(),
      detail: vi.fn().mockResolvedValue({
        ok: false,
        error: { code: 'journal_not_found', status: 404 },
      }),
    };
    const unknownId = 'private-unknown-record-id';
    renderPage(buildAppJournalDetailPath(unknownId), readPort);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: ko.app.journalDetail.headerTitle }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText(ko.app.journalDetail.notFound.heading)).toBeInTheDocument();
    expect(screen.queryByText(unknownId)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: ko.app.journalDetail.navigation.review }),
    ).not.toBeInTheDocument();
  });

  it.each([
    [
      'invalid request',
      { code: 'invalid_request' as const, status: 400 },
      ko.app.journalDetail.invalidRequest.title,
    ],
    [
      'malformed success',
      { code: 'invalid_result' as const, status: 200 },
      ko.app.journalDetail.invalidResult.title,
    ],
    ['network failure', { code: 'read_failed' as const }, ko.app.journalDetail.error.title],
  ])('renders %s with a retry action', async (_label, error, heading) => {
    const detail = vi.fn().mockResolvedValue({ ok: false, error });
    const readPort: JournalReadPort = {
      list: vi.fn(),
      detail,
    };
    renderPage(buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID), readPort);

    await waitFor(() => expect(screen.getByText(heading)).toBeInTheDocument());
    const retryButton = screen.getByRole('button', { name: /다시 시도|Try again/ });
    expect(retryButton).toBeInTheDocument();
    retryButton.click();
    await waitFor(() => expect(detail).toHaveBeenCalledTimes(2));
  });

  it('keeps the canonical review route link without transferring fixture state', async () => {
    renderPage(buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID), successfulPort(INVESTMENT_DETAIL));
    await waitFor(() => expect(screen.getByText('thesis')).toBeInTheDocument());
    expect(
      screen.getByRole('link', { name: ko.app.journalDetail.navigation.review }),
    ).toHaveAttribute('href', buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID));
  });
});
