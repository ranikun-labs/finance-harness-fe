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
import { JournalDetailPage } from '@/pages/JournalDetailPage';

const PRIMARY_INVESTMENT_ID = 'journal-2026-06-28-01';
const SECOND_INVESTMENT_ID = 'journal-2026-06-24-01';
const STUDY_ID = 'journal-2026-06-27-01';

function renderPage(path: string, locale: 'ko' | 'en' = 'ko') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <I18nProvider locale={locale}>
        <Routes>
          <Route path={APP_ROUTE_PATHS.journalDetail} element={<JournalDetailPage />} />
        </Routes>
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe('JournalDetailPage', () => {
  it('renders the primary investment fixture with exactly one h1 and ordered sections', () => {
    renderPage(buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID));

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole('heading', { level: 1, name: ko.app.journalDetail.headerTitle }),
    ).toBeInTheDocument();

    const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
    expect(sectionHeadings.map((heading) => heading.textContent)).toEqual([
      ko.app.journalList.subjects.semiconductorCompanyA,
      ko.app.journalDetail.investment.questionHeading,
      ko.app.journalDetail.investment.aiChecklistHeading,
      ko.app.journalDetail.investment.recordHeading,
      ko.app.journalDetail.investment.checkedItemsHeading,
    ]);
  });

  it('renders the second investment fixture without changing its list identity', () => {
    renderPage(buildAppJournalDetailPath(SECOND_INVESTMENT_ID));

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: ko.app.journalList.subjects.batteryCompanyC,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('관망')).toBeInTheDocument();
    expect(screen.getByText('불안')).toBeInTheDocument();
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
  });

  it('renders the study fixture with study-only sections and no investment action or emotion', () => {
    renderPage(buildAppJournalDetailPath(STUDY_ID));

    expect(screen.getByRole('heading', { level: 2, name: '월말 리밸런싱' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: ko.app.journalDetail.study.questionHeading,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: ko.app.journalDetail.study.summaryHeading,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: ko.app.journalDetail.study.nextChecksHeading,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText(ko.app.journalDetail.metadata.pastAction)).not.toBeInTheDocument();
    expect(screen.queryByText(ko.app.journalDetail.metadata.pastEmotion)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: ko.app.journalDetail.investment.aiChecklistHeading,
      }),
    ).not.toBeInTheDocument();
  });

  it('uses semantic metadata, date, and list structures', () => {
    const { container } = renderPage(buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID));

    const metadata = container.querySelector('dl');
    expect(metadata).not.toBeNull();
    expect(metadata!.querySelectorAll('dt').length).toBeGreaterThanOrEqual(4);
    expect(metadata!.querySelectorAll('dd').length).toBeGreaterThanOrEqual(4);

    const time = container.querySelector('time');
    expect(time).toHaveAttribute('datetime', '2026-06-28');

    const checklistHeading = screen.getByRole('heading', {
      name: ko.app.journalDetail.investment.aiChecklistHeading,
    });
    const checklistSection = checklistHeading.closest('section')!;
    expect(within(checklistSection).getByRole('list').tagName).toBe('UL');
    expect(within(checklistSection).getAllByRole('listitem')).toHaveLength(4);
  });

  it('links back to the journal list and to the encoded review route', () => {
    renderPage(buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID));

    expect(screen.getByRole('link', { name: ko.app.journalDetail.backLabel })).toHaveAttribute(
      'href',
      APP_ROUTE_PATHS.journalList,
    );
    expect(
      screen.getByRole('link', { name: ko.app.journalDetail.navigation.review }),
    ).toHaveAttribute('href', buildAppJournalReviewPath(PRIMARY_INVESTMENT_ID));
  });

  it('looks up an encoded route param without decoding it again', () => {
    const encodedPath = `${APP_ROUTE_PATHS.journalList}/journal%2D2026%2D06%2D28%2D01`;
    renderPage(encodedPath);

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: ko.app.journalList.subjects.semiconductorCompanyA,
      }),
    ).toBeInTheDocument();
  });

  it('renders a local Not Found for an unknown id without exposing the id or review action', () => {
    const unknownId = 'private-unknown-record-id';
    renderPage(buildAppJournalDetailPath(unknownId));

    expect(
      screen.getByRole('heading', { level: 1, name: ko.app.journalDetail.notFound.heading }),
    ).toBeInTheDocument();
    expect(screen.queryByText(unknownId)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: ko.app.journalDetail.navigation.review }),
    ).not.toBeInTheDocument();
    for (const link of screen.getAllByRole('link', { name: /기록 목록으로 돌아가기/ })) {
      expect(link).toHaveAttribute('href', APP_ROUTE_PATHS.journalList);
    }
  });

  it('renders a local Not Found for a malformed encoded id without throwing', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      expect(() => renderPage(`${APP_ROUTE_PATHS.journalList}/%E0%A4%A`)).not.toThrow();
      expect(
        screen.getByRole('heading', { level: 1, name: ko.app.journalDetail.notFound.heading }),
      ).toBeInTheDocument();
    } finally {
      warning.mockRestore();
    }
  });

  it('renders matching English UI labels while preserving fixture-authored content', () => {
    renderPage(buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID), 'en');

    expect(
      screen.getByRole('heading', { level: 1, name: en.app.journalDetail.headerTitle }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: en.app.journalList.subjects.semiconductorCompanyA,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: en.app.journalDetail.investment.questionHeading,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('반도체 기업 A 요즘 어때?')).toBeInTheDocument();
  });

  it('renders HTML-like fixture content as inert text', () => {
    const htmlEntry: JournalEntry = {
      id: 'html-like-entry',
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
      const { container } = renderPage(buildAppJournalDetailPath(htmlEntry.id));
      expect(screen.getByText(htmlEntry.title)).toBeInTheDocument();
      expect(screen.getByText(htmlEntry.question)).toBeInTheDocument();
      expect(screen.getByText(htmlEntry.memo)).toBeInTheDocument();
      expect(screen.getByText(htmlEntry.nextChecks[0].text)).toBeInTheDocument();
      expect(container.querySelector('script, img, button')).toBeNull();
    } finally {
      JOURNAL_ENTRIES.pop();
    }
  });

  it('does not expose edit, delete, share, save, or form controls', () => {
    const { container } = renderPage(buildAppJournalDetailPath(PRIMARY_INVESTMENT_ID));

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('form')).toBeNull();
    expect(container.querySelector('[type="submit"]')).toBeNull();
    for (const label of ['수정', '삭제', '공유', '내보내기', '저장']) {
      expect(screen.queryByRole('link', { name: label })).not.toBeInTheDocument();
    }
  });
});
