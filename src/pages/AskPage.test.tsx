import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { APP_ROUTE_PATHS, buildAppAskPath, buildAppJournalNewPath } from '@/constants/routes';
import { I18nProvider } from '@/i18n/I18nContext';
import { en } from '@/i18n/messages/en';
import { ko } from '@/i18n/messages/ko';
import { AskPage } from '@/pages/AskPage';

function renderPage(path: string, locale: 'ko' | 'en' = 'ko') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <I18nProvider locale={locale}>
        <AskPage />
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe('AskPage', () => {
  it.each([APP_ROUTE_PATHS.ask, `${APP_ROUTE_PATHS.ask}?q=`, `${APP_ROUTE_PATHS.ask}?q=%20%20%20`])(
    'renders the empty state for %s',
    (path) => {
      renderPage(path);

      expect(
        screen.getByRole('heading', { level: 1, name: ko.app.ask.header.title }),
      ).toBeInTheDocument();
      expect(screen.getByText(ko.app.ask.empty.title)).toBeInTheDocument();
      expect(screen.getByText(ko.app.ask.empty.description)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: ko.app.ask.empty.cta })).toHaveAttribute(
        'href',
        APP_ROUTE_PATHS.appHome,
      );
    },
  );

  it('renders the English empty state', () => {
    renderPage(APP_ROUTE_PATHS.ask, 'en');

    expect(
      screen.getByRole('heading', { level: 1, name: en.app.ask.header.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(en.app.ask.empty.description)).toBeInTheDocument();
  });

  it.each([
    '실적 전망은 어떻게 확인할까?',
    'revenue & margins < expectations?',
    '가'.repeat(180),
    'A'.repeat(240),
  ])('renders an encoded question as text: %s', (question) => {
    renderPage(buildAppAskPath(question));

    expect(screen.getByText(question)).toBeInTheDocument();
  });

  it('renders a malformed percent sequence without failing', () => {
    renderPage(`${APP_ROUTE_PATHS.ask}?q=%E0%A4%A`);

    expect(screen.getByText(/�%A/)).toBeInTheDocument();
  });

  it('renders HTML-like input only as text', () => {
    const question = '<script>alert(1)</script>';
    const { container } = renderPage(buildAppAskPath(question));

    expect(screen.getByText(question)).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
  });

  it.each([
    ['ko', ko],
    ['en', en],
  ] as const)('renders the %s result hierarchy with one h1', (locale, messages) => {
    renderPage(buildAppAskPath('Example question'), locale);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole('heading', { level: 1, name: messages.app.ask.header.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: messages.app.ask.perspectives.heading,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(messages.app.ask.fixtureNotice);
  });

  it('keeps the approved result sections in document order', () => {
    renderPage(buildAppAskPath('순서 확인'));

    const headings = [
      ko.app.ask.questionLabel,
      ko.app.ask.perspectives.heading,
      ko.app.ask.checklist.heading,
      ko.app.ask.recordQuestions.heading,
    ].map((name) => screen.getByRole('heading', { level: 2, name }));

    for (let index = 0; index < headings.length - 1; index += 1) {
      expect(
        headings[index].compareDocumentPosition(headings[index + 1]) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }

    const recordQuestions = headings.at(-1)!.closest('section')!;
    const recordQuestionsList = within(recordQuestions).getByRole('list');
    const ctaNavigation = screen.getByRole('navigation', { name: ko.app.ask.header.title });
    expect(
      recordQuestionsList.compareDocumentPosition(ctaNavigation) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders semantic six-item checklist and three record questions', () => {
    renderPage(buildAppAskPath('목록 확인'));

    const checklist = screen
      .getByRole('heading', { name: ko.app.ask.checklist.heading })
      .closest('section')!;
    const recordQuestions = screen
      .getByRole('heading', { name: ko.app.ask.recordQuestions.heading })
      .closest('section')!;

    expect(within(checklist).getByRole('list').tagName).toBe('UL');
    expect(within(checklist).getAllByRole('listitem')).toHaveLength(6);
    expect(within(recordQuestions).getByRole('list').tagName).toBe('UL');
    expect(within(recordQuestions).getAllByRole('listitem')).toHaveLength(3);
  });

  it('links the three navigation CTAs without transferring fixture or query state', () => {
    renderPage(buildAppAskPath('CTA 확인'));

    expect(screen.getByRole('link', { name: ko.app.ask.navigation.studyNote })).toHaveAttribute(
      'href',
      buildAppJournalNewPath('study'),
    );
    expect(
      screen.getByRole('link', { name: ko.app.ask.navigation.investmentRecord }),
    ).toHaveAttribute('href', buildAppJournalNewPath('investment'));
    expect(screen.getByRole('link', { name: ko.app.ask.navigation.askAgain })).toHaveAttribute(
      'href',
      APP_ROUTE_PATHS.appHome,
    );
  });

  it('has no investment execution CTA, loading/error state, or form control', () => {
    renderPage(buildAppAskPath('정책 확인'));

    for (const label of ['매수하기', '매도하기', '목표가', '손절가']) {
      expect(screen.queryByRole('link', { name: label })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: label })).not.toBeInTheDocument();
    }
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
