import { render, screen, within } from '@testing-library/react';
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
import { JOURNAL_ENTRIES, type JournalEntry } from '@/mocks/journalEntries';
import { JournalReviewPage } from '@/pages/JournalReviewPage';

const PRIMARY_INVESTMENT_ID = 'journal-2026-06-28-01';
const SECOND_INVESTMENT_ID = 'journal-2026-06-24-01';
const STUDY_ID = 'journal-2026-06-27-01';

function renderPage(path: string, locale: 'ko' | 'en' = 'ko') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <I18nProvider locale={locale}>
        <Routes>
          <Route path={APP_ROUTE_PATHS.journalReview} element={<JournalReviewPage />} />
        </Routes>
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe('JournalReviewPage', () => {
  it('preserves the existing parameterized title contract', () => {
    expect(ko.app.journalReview.title).toBe('복기 — {{id}}');
    expect(en.app.journalReview.title).toBe('Review — {{id}}');
  });

  it('renders the primary investment fixture with one h1 and ordered sections', () => {
    renderPage(buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID));

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole('heading', { level: 1, name: ko.app.journalReview.headerTitle }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent),
    ).toEqual([
      ko.app.journalReview.summary.heading,
      ko.app.journalReview.investment.questionHeading,
      ko.app.journalReview.investment.memoHeading,
      ko.app.journalReview.investment.statusHeading,
      ko.app.journalReview.investment.reflectionHeading,
    ]);
    expect(screen.getByText(ko.app.journalReview.policyNotice)).toBeInTheDocument();
  });

  it('renders the second investment fixture with its own action, emotion, and check states', () => {
    renderPage(buildAppJournalReviewPath(SECOND_INVESTMENT_ID));

    expect(screen.getByText(ko.app.journalList.subjects.batteryCompanyC)).toBeInTheDocument();
    expect(screen.getByText('관망')).toBeInTheDocument();
    expect(screen.getByText('불안')).toBeInTheDocument();
    expect(screen.getAllByText(ko.app.journalReview.status.checked)).toHaveLength(1);
    expect(screen.getAllByText(ko.app.journalReview.status.unchecked)).toHaveLength(3);
  });

  it('renders the study structure without investment action, emotion, or prompts', () => {
    renderPage(buildAppJournalReviewPath(STUDY_ID));

    expect(screen.getByText('월말 리밸런싱')).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent),
    ).toEqual([
      ko.app.journalReview.summary.heading,
      ko.app.journalReview.study.questionHeading,
      ko.app.journalReview.study.memoHeading,
      ko.app.journalReview.study.statusHeading,
      ko.app.journalReview.study.reflectionHeading,
    ]);
    expect(screen.queryByText(ko.app.journalReview.metadata.pastAction)).not.toBeInTheDocument();
    expect(screen.queryByText(ko.app.journalReview.metadata.pastEmotion)).not.toBeInTheDocument();
    expect(
      screen.queryByText(ko.app.journalReview.investment.prompts.assumption),
    ).not.toBeInTheDocument();
    expect(screen.getByText(ko.app.journalReview.study.prompts.nextQuestion)).toBeInTheDocument();
  });

  it('uses semantic metadata, date, status list, and reflection list structures', () => {
    const { container } = renderPage(buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID));

    const metadata = container.querySelector('dl');
    expect(metadata).not.toBeNull();
    expect(metadata!.querySelectorAll('dt')).toHaveLength(4);
    expect(metadata!.querySelectorAll('dd')).toHaveLength(4);
    expect(container.querySelector('time')).toHaveAttribute('datetime', '2026-06-28');

    const statusSection = screen
      .getByRole('heading', { name: ko.app.journalReview.investment.statusHeading })
      .closest('section')!;
    expect(within(statusSection).getByRole('list').tagName).toBe('UL');
    expect(within(statusSection).getAllByRole('listitem')).toHaveLength(3);

    const reflectionSection = screen
      .getByRole('heading', { name: ko.app.journalReview.investment.reflectionHeading })
      .closest('section')!;
    expect(within(reflectionSection).getByRole('list').tagName).toBe('UL');
    expect(within(reflectionSection).getAllByRole('listitem')).toHaveLength(4);
  });

  it('uses the canonical fixture id for both detail return links', () => {
    renderPage(buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID));
    const expectedHref = buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID);

    const detailLinks = screen.getAllByRole('link', {
      name: ko.app.journalReview.navigation.detail,
    });
    expect(detailLinks).toHaveLength(2);
    for (const link of detailLinks) {
      expect(link).toHaveAttribute('href', expectedHref);
    }
  });

  it('looks up an encoded route param without decoding it again', () => {
    const encodedPath = `${APP_ROUTE_PATHS.journalList}/journal%2D2026%2D06%2D28%2D01/review`;
    renderPage(encodedPath);

    expect(screen.getByText(ko.app.journalList.subjects.semiconductorCompanyA)).toBeInTheDocument();
  });

  it('renders a local Not Found for an unknown id with only journal-list destinations', () => {
    const unknownId = 'private-unknown-record-id';
    renderPage(buildAppJournalReviewPath(unknownId));

    expect(
      screen.getByRole('heading', { level: 1, name: ko.app.journalReview.notFound.heading }),
    ).toBeInTheDocument();
    expect(screen.queryByText(unknownId)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: ko.app.journalReview.navigation.detail }),
    ).not.toBeInTheDocument();
    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('href', APP_ROUTE_PATHS.journalList);
    }
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('renders a local Not Found for a malformed encoded id without throwing', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      expect(() => renderPage(`${APP_ROUTE_PATHS.journalList}/%E0%A4%A/review`)).not.toThrow();
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: ko.app.journalReview.notFound.heading,
        }),
      ).toBeInTheDocument();
    } finally {
      warning.mockRestore();
    }
  });

  it('renders matching English labels while preserving fixture-authored text', () => {
    renderPage(buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID), 'en');

    expect(
      screen.getByRole('heading', { level: 1, name: en.app.journalReview.headerTitle }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: en.app.journalReview.investment.questionHeading,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('반도체 기업 A 요즘 어때?')).toBeInTheDocument();
    expect(screen.getByText(en.app.journalReview.policyNotice)).toBeInTheDocument();
  });

  it('renders HTML-like fixture content as inert text', () => {
    const htmlEntry: JournalEntry = {
      id: 'html-like-review-entry',
      type: 'study',
      title: '<strong>Study title</strong>',
      recordedAt: '2026-06-20',
      question: '<script>alert(1)</script>',
      memo: '<img src=x onerror=alert(1)>',
      checkedCount: 0,
      totalCount: 1,
      nextChecks: [{ text: '<button>not interactive</button>', checked: false }],
    };
    JOURNAL_ENTRIES.push(htmlEntry);
    try {
      const { container } = renderPage(buildAppJournalReviewPath(htmlEntry.id));
      expect(screen.getByText(htmlEntry.title)).toBeInTheDocument();
      expect(screen.getByText(htmlEntry.question)).toBeInTheDocument();
      expect(screen.getByText(htmlEntry.memo)).toBeInTheDocument();
      expect(screen.getByText(htmlEntry.nextChecks[0].text)).toBeInTheDocument();
      expect(container.querySelector('script, img, button')).toBeNull();
    } finally {
      JOURNAL_ENTRIES.pop();
    }
  });

  it('exposes no form, mutation, or recommendation controls', () => {
    const { container } = renderPage(buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID));

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('form, input, textarea, [type="submit"]')).toBeNull();
    for (const label of ['저장', '제출', '수정', '삭제', '지금 매수', '지금 매도']) {
      expect(screen.queryByRole('link', { name: label })).not.toBeInTheDocument();
    }
    expect(screen.getAllByRole('note')).toHaveLength(1);
  });
});
