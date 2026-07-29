import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { APP_ROUTE_PATHS, buildAppAskPath, buildAppJournalDetailPath } from '@/constants/routes';
import { I18nProvider } from '@/i18n/I18nContext';
import { en } from '@/i18n/messages/en';
import { ko } from '@/i18n/messages/ko';
import { JOURNAL_ENTRIES, type JournalEntry } from '@/mocks/journalEntries';
import { HomePage } from '@/pages/HomePage';

function renderPage(locale: 'ko' | 'en' = 'ko') {
  return render(
    <MemoryRouter>
      <I18nProvider locale={locale}>
        <HomePage />
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe('HomePage', () => {
  it('preserves the existing home title contract', () => {
    expect(ko.app.home.title).toBe('Home');
    expect(en.app.home.title).toBe('Home');
  });

  it('renders one Korean h1 and one semantic Hero link to Ask without a query', () => {
    const { container } = renderPage();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole('heading', { level: 1, name: ko.app.home.hero.heading }),
    ).toBeInTheDocument();

    const heroLink = screen.getByRole('link', { name: new RegExp(ko.app.home.hero.heading) });
    expect(heroLink).toHaveAttribute('href', buildAppAskPath());
    expect(new URL(heroLink.getAttribute('href')!, 'https://example.test').search).toBe('');
    expect(heroLink.querySelectorAll('a, button, input, textarea')).toHaveLength(0);

    expect(container.querySelector('form, input, textarea, [type="submit"]')).toBeNull();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('renders matching English Hero and section messages', () => {
    renderPage('en');

    expect(
      screen.getByRole('heading', { level: 1, name: en.app.home.hero.heading }),
    ).toBeInTheDocument();
    expect(screen.getByText(en.app.home.hero.description)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: en.app.home.recentRecords.heading }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: en.app.home.recentRecords.viewAll })).toHaveAttribute(
      'href',
      APP_ROUTE_PATHS.journalList,
    );
  });

  it('derives the newest two mixed entries without mutating the fixture order', () => {
    const originalIds = JOURNAL_ENTRIES.map((entry) => entry.id);
    renderPage();

    const section = screen
      .getByRole('heading', { level: 2, name: ko.app.home.recentRecords.heading })
      .closest('section')!;
    const items = within(section).getAllByRole('listitem');

    expect(items).toHaveLength(2);
    expect(
      within(items[0]).getByText(ko.app.journalList.subjects.semiconductorCompanyA),
    ).toBeVisible();
    expect(within(items[0]).getByRole('link')).toHaveAttribute(
      'href',
      buildAppJournalDetailPath('journal-2026-06-28-01'),
    );
    expect(within(items[1]).getByText('월말 리밸런싱')).toBeVisible();
    expect(within(items[1]).getByRole('link')).toHaveAttribute(
      'href',
      buildAppJournalDetailPath('journal-2026-06-27-01'),
    );
    expect(JOURNAL_ENTRIES.map((entry) => entry.id)).toEqual(originalIds);
  });

  it('links to the full journal list without exposing a journal-new action', () => {
    renderPage();

    expect(screen.getByRole('link', { name: ko.app.home.recentRecords.viewAll })).toHaveAttribute(
      'href',
      APP_ROUTE_PATHS.journalList,
    );
    expect(screen.queryByRole('link', { name: /기록 작성|저장하기/ })).not.toBeInTheDocument();
  });

  it('renders the shared EmptyState with one Ask action when the fixture is empty', () => {
    const savedEntries = [...JOURNAL_ENTRIES];
    JOURNAL_ENTRIES.length = 0;

    try {
      renderPage();

      expect(
        screen.getByRole('heading', { level: 2, name: ko.app.home.recentRecords.heading }),
      ).toBeInTheDocument();
      expect(screen.getByText(ko.app.home.empty.title)).toBeInTheDocument();
      expect(screen.getByText(ko.app.home.empty.description)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: ko.app.home.empty.action })).toHaveAttribute(
        'href',
        buildAppAskPath(),
      );
      expect(
        screen.queryByRole('link', { name: ko.app.home.recentRecords.viewAll }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /기록 작성|저장하기/ })).not.toBeInTheDocument();
    } finally {
      JOURNAL_ENTRIES.push(...savedEntries);
    }
  });

  it('renders long HTML-like fixture text inertly', () => {
    const longEntry: JournalEntry = {
      id: 'home-html-like-entry',
      type: 'study',
      title: `<strong>${'A'.repeat(180)}</strong>`,
      recordedAt: '2026-12-31',
      question: '<script>alert(1)</script>',
      memo: '<img src=x onerror=alert(1)>',
      checkedCount: 0,
      totalCount: 1,
      nextChecks: [{ text: '확인 항목', checked: false }],
    };
    JOURNAL_ENTRIES.push(longEntry);

    try {
      const { container } = renderPage();

      expect(screen.getByText(longEntry.title)).toBeInTheDocument();
      expect(screen.getByText(longEntry.question)).toBeInTheDocument();
      expect(screen.getByText(longEntry.memo)).toBeInTheDocument();
      expect(container.querySelector('script, img')).toBeNull();
    } finally {
      JOURNAL_ENTRIES.pop();
    }
  });

  it('does not expose excluded or recommendation-like Home controls', () => {
    renderPage();

    for (const name of [
      /빠른 질문|시장 체크|관심종목 체크/,
      /Watchlist|관심종목/,
      /오늘의 질문|추천 질문/,
      /실시간|시세|수익률|종목 순위/,
      /투자 추천|매수 추천|매도 추천/,
    ]) {
      expect(screen.queryByRole('heading', { name })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
    }
  });
});
