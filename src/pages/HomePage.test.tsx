import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';

import { APP_ROUTE_PATHS, buildAppJournalDetailPath } from '@/constants/routes';
import { I18nProvider } from '@/i18n/I18nContext';
import { en } from '@/i18n/messages/en';
import { ko } from '@/i18n/messages/ko';
import { JOURNAL_ENTRIES, type JournalEntry } from '@/mocks/journalEntries';
import { HomePage } from '@/pages/HomePage';

function LocationProbe() {
  const location = useLocation();
  const state = location.state as { reviewFlow?: string } | null;

  return (
    <>
      <output data-testid="location">
        {location.pathname}
        {location.search}
      </output>
      <output data-testid="location-state">{state?.reviewFlow ?? ''}</output>
    </>
  );
}

function renderPage(locale: 'ko' | 'en' = 'ko') {
  return render(
    <MemoryRouter initialEntries={[APP_ROUTE_PATHS.appHome]}>
      <I18nProvider locale={locale}>
        <HomePage />
        <LocationProbe />
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe('HomePage / Review Start', () => {
  it('renders the approved Review Start hierarchy and primary question form', () => {
    renderPage();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole('heading', { level: 1, name: ko.app.home.hero.heading }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: ko.app.home.question.label })).toHaveAttribute(
      'placeholder',
      ko.app.home.question.placeholder,
    );
    expect(screen.getByRole('button', { name: ko.app.home.question.submit })).toHaveAttribute(
      'type',
      'submit',
    );
    expect(screen.getByRole('heading', { name: ko.app.home.examples.heading })).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(ko.app.home.policyNotice);
  });

  it('blocks whitespace-only review and clears the inline error when typing begins', () => {
    renderPage();

    const question = screen.getByRole('textbox', { name: ko.app.home.question.label });
    fireEvent.change(question, { target: { value: '   ' } });
    fireEvent.submit(
      screen.getByRole('button', { name: ko.app.home.question.submit }).closest('form')!,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(ko.app.home.question.required);
    expect(question).toHaveValue('   ');
    expect(question).toHaveAttribute('aria-invalid', 'true');

    fireEvent.change(question, { target: { value: '실적을 확인하고 싶어요' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(question).toHaveAttribute('aria-invalid', 'false');
  });

  it.each([
    ['Ctrl+Enter', { ctrlKey: true }],
    ['Meta+Enter', { metaKey: true }],
  ] as const)(
    'blocks an empty question with %s and keeps focus semantics',
    (_shortcut, modifiers) => {
      renderPage();

      const question = screen.getByRole('textbox', { name: ko.app.home.question.label });
      question.focus();
      fireEvent.keyDown(question, { key: 'Enter', ...modifiers });

      expect(screen.getByTestId('location').textContent).toBe(APP_ROUTE_PATHS.appHome);
      expect(screen.getByTestId('location-state')).toHaveTextContent('');
      expect(screen.getByRole('alert')).toHaveTextContent(ko.app.home.question.required);
      expect(question).toHaveValue('');
      expect(question).toHaveAttribute('aria-invalid', 'true');
      expect(question).toHaveFocus();
      expect(question).toHaveAttribute('aria-describedby', 'review-question-error');
    },
  );

  it.each([
    ['Ctrl+Enter', { ctrlKey: true }],
    ['Meta+Enter', { metaKey: true }],
  ] as const)(
    'blocks a whitespace question with %s and preserves the connected alert',
    (_shortcut, modifiers) => {
      renderPage();

      const question = screen.getByRole('textbox', { name: ko.app.home.question.label });
      fireEvent.change(question, { target: { value: '   ' } });
      question.focus();
      fireEvent.keyDown(question, { key: 'Enter', ...modifiers });

      expect(screen.getByTestId('location').textContent).toBe(APP_ROUTE_PATHS.appHome);
      expect(screen.getByRole('alert')).toHaveTextContent(ko.app.home.question.required);
      expect(question).toHaveValue('   ');
      expect(question).toHaveAttribute('aria-invalid', 'true');
      expect(question).toHaveAttribute('aria-describedby', 'review-question-error');
      expect(question).toHaveFocus();
    },
  );

  it.each([
    ['Ctrl+Enter', { ctrlKey: true }],
    ['Meta+Enter', { metaKey: true }],
  ] as const)('starts the loading route with a valid question on %s', (_shortcut, modifiers) => {
    renderPage();

    const question = screen.getByRole('textbox', { name: ko.app.home.question.label });
    fireEvent.change(question, { target: { value: '실적 전망을 확인하고 싶어요' } });
    question.focus();
    fireEvent.keyDown(question, { key: 'Enter', ...modifiers });

    expect(screen.getByTestId('location')).toHaveTextContent(
      `${APP_ROUTE_PATHS.ask}?q=%EC%8B%A4%EC%A0%81+%EC%A0%84%EB%A7%9D%EC%9D%84+%ED%99%95%EC%9D%B8%ED%95%98%EA%B3%A0+%EC%8B%B6%EC%96%B4%EC%9A%94`,
    );
    expect(screen.getByTestId('location-state')).toHaveTextContent('loading');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders English labels and preserves the display-only recent journal surface', () => {
    renderPage('en');

    expect(
      screen.getByRole('heading', { level: 1, name: en.app.home.hero.heading }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: en.app.home.question.label })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: en.app.home.recentRecords.heading }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: en.app.home.recentRecords.viewAll })).toHaveAttribute(
      'href',
      APP_ROUTE_PATHS.journalList,
    );
  });

  it('derives the newest two mixed entries without mutating fixture order', () => {
    const originalIds = JOURNAL_ENTRIES.map((entry) => entry.id);
    renderPage();

    const section = screen
      .getByRole('heading', { name: ko.app.home.recentRecords.heading })
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

  it('uses the shared empty state without creating a persistence action', () => {
    const savedEntries = [...JOURNAL_ENTRIES];
    JOURNAL_ENTRIES.length = 0;

    try {
      renderPage();

      expect(screen.getByText(ko.app.home.empty.title)).toBeInTheDocument();
      expect(screen.getByText(ko.app.home.empty.description)).toBeInTheDocument();
      const recentSection = screen
        .getByRole('heading', { name: ko.app.home.recentRecords.heading })
        .closest('section')!;
      expect(
        within(recentSection).getByRole('button', { name: ko.app.home.empty.action }),
      ).toBeInTheDocument();
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

  it('does not expose excluded dashboard or recommendation controls', () => {
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
