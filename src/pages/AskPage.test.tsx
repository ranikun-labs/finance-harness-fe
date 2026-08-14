import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { APP_ROUTE_PATHS, AUTH_ROUTE_PATHS, buildAppAskPath } from '@/constants/routes';
import { I18nProvider } from '@/i18n/I18nContext';
import { en } from '@/i18n/messages/en';
import { ko } from '@/i18n/messages/ko';
import { getReviewFixture } from '@/mocks/reviewResult';
import { AskPage } from '@/pages/AskPage';

function DecisionContextStateProbe() {
  const location = useLocation();
  const context = (
    location.state as {
      authResumeIntent?: { decisionContext?: { checklist?: unknown[] } };
    } | null
  )?.authResumeIntent?.decisionContext;
  return <span data-testid="decision-context-state">{context?.checklist?.length ?? ''}</span>;
}

function renderPage(path: string, locale: 'ko' | 'en' = 'ko', state?: { reviewFlow?: 'loading' }) {
  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: APP_ROUTE_PATHS.ask,
          search: path.startsWith(APP_ROUTE_PATHS.ask)
            ? path.slice(APP_ROUTE_PATHS.ask.length)
            : path,
          state,
        },
      ]}
    >
      <I18nProvider locale={locale}>
        <AskPage />
        <DecisionContextStateProbe />
      </I18nProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe('AskPage / Structured Review Result', () => {
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

  it.each(['실적 전망은 어떻게 확인할까?', 'revenue & margins < expectations?', '가'.repeat(180)])(
    'renders an encoded question as inert text: %s',
    (question) => {
      renderPage(buildAppAskPath(question));

      expect(screen.getByText(question)).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 1, name: ko.app.ask.structured.resultTitle }),
      ).toBeInTheDocument();
    },
  );

  it('renders the full semantic hierarchy in canonical order', () => {
    renderPage(buildAppAskPath('순서 확인'));

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const headings = [
      ko.app.ask.structured.questionLabel,
      ko.app.ask.structured.checklist.heading,
      ko.app.ask.structured.fact.heading,
      ko.app.ask.structured.inference.heading,
      ko.app.ask.structured.unknown.heading,
    ].map((name) => screen.getByRole('heading', { level: 2, name }));

    for (let index = 0; index < headings.length - 1; index += 1) {
      expect(
        headings[index].compareDocumentPosition(headings[index + 1]) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it('keeps checklist interaction accessible and keeps facts with source/as-of', () => {
    renderPage(buildAppAskPath('구조 확인'));

    const checklist = screen
      .getByRole('heading', { name: ko.app.ask.structured.checklist.heading })
      .closest('section')!;
    const checklistItems = within(checklist).getAllByRole('listitem');
    expect(checklistItems).toHaveLength(getReviewFixture().checklist.length);
    const firstCheck = within(checklistItems[0]).getByRole('button');
    expect(within(checklist).getByText('0/4 확인')).toBeInTheDocument();
    expect(within(checklist).getAllByRole('button', { pressed: false })).toHaveLength(4);
    expect(firstCheck).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(firstCheck);
    expect(firstCheck).toHaveAttribute('aria-pressed', 'true');
    expect(within(checklist).getByText('1/4 확인')).toBeInTheDocument();
    expect(within(checklist).getAllByRole('button', { pressed: true })).toHaveLength(1);
    fireEvent.click(firstCheck);
    expect(firstCheck).toHaveAttribute('aria-pressed', 'false');
    expect(within(checklist).getByText('0/4 확인')).toBeInTheDocument();
    expect(within(checklist).getAllByRole('button', { pressed: false })).toHaveLength(4);

    const facts = screen
      .getByRole('heading', { name: ko.app.ask.structured.fact.heading })
      .closest('section')!;
    const factItems = within(facts).getAllByRole('listitem');
    expect(factItems).toHaveLength(getReviewFixture().facts.length);
    for (const item of factItems) {
      expect(within(item).getByText(ko.app.ask.structured.fact.sourceLabel)).toBeInTheDocument();
      expect(within(item).getByText(ko.app.ask.structured.fact.asOfLabel)).toBeInTheDocument();
    }
  });

  it('renders a partial result as normal incomplete output, without inference', () => {
    renderPage(`${buildAppAskPath('부분 결과')}&fixture=partial`);

    expect(screen.getByRole('status')).toHaveTextContent(ko.app.ask.structured.partialTitle);
    const checklist = screen
      .getByRole('heading', { name: ko.app.ask.structured.checklist.heading })
      .closest('section')!;
    expect(within(checklist).getByText('0/4 확인')).toBeInTheDocument();
    expect(within(checklist).getAllByRole('button', { pressed: false })).toHaveLength(4);
    expect(
      screen.getByRole('heading', { name: ko.app.ask.structured.fact.heading }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: ko.app.ask.structured.inference.heading }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: ko.app.ask.structured.unknown.heading }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders loading with the question retained and transitions to a result', () => {
    vi.useFakeTimers();
    renderPage(buildAppAskPath('로딩 확인'), 'ko', { reviewFlow: 'loading' });

    expect(
      screen.getByRole('heading', { level: 1, name: ko.app.ask.loading.title }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status', { name: ko.app.ask.loading.title })).toBeInTheDocument();
    expect(screen.getByText('로딩 확인')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: ko.app.ask.structured.resultTitle }),
    ).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(
      screen.getByRole('heading', { level: 1, name: ko.app.ask.structured.resultTitle }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('separates Review Error from Partial Result and retries to success', () => {
    vi.useFakeTimers();
    renderPage(`${APP_ROUTE_PATHS.ask}?q=${encodeURIComponent('오류를 다시 시도')}&fixture=error`);

    expect(screen.getByRole('alert')).toHaveTextContent(ko.app.ask.error.description);
    expect(screen.getByText('오류를 다시 시도')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ko.app.ask.error.retry })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ko.app.ask.error.edit })).toBeInTheDocument();
    expect(screen.queryByText(ko.app.ask.structured.partialTitle)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: ko.app.ask.error.retry }));
    expect(
      screen.getByRole('heading', { level: 1, name: ko.app.ask.loading.title }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status', { name: ko.app.ask.loading.title })).toBeInTheDocument();
    expect(screen.getByText('오류를 다시 시도')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(
      screen.getByRole('heading', { level: 1, name: ko.app.ask.structured.resultTitle }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    const checklist = screen
      .getByRole('heading', { name: ko.app.ask.structured.checklist.heading })
      .closest('section')!;
    expect(within(checklist).getByText('0/4 확인')).toBeInTheDocument();
    expect(within(checklist).getAllByRole('button', { pressed: false })).toHaveLength(4);
  });

  it('keeps the approved presentation CTA seam on existing Journal New routes', () => {
    renderPage(buildAppAskPath('CTA 확인'));

    expect(
      screen.getByRole('link', { name: new RegExp(ko.app.ask.handoff.study.title) }),
    ).toHaveAttribute('href', AUTH_ROUTE_PATHS.entry);
    expect(
      screen.getByRole('link', { name: new RegExp(ko.app.ask.handoff.investment.title) }),
    ).toHaveAttribute('href', AUTH_ROUTE_PATHS.entry);
    expect(
      screen.queryByRole('link', { name: /매수하기|매도하기|목표가|손절가/ }),
    ).not.toBeInTheDocument();
  });

  it('hands the review snapshot to both Journal New CTA routes without changing the create contract', () => {
    renderPage(buildAppAskPath('context handoff'));

    fireEvent.click(
      screen.getByRole('link', { name: new RegExp(ko.app.ask.handoff.investment.title) }),
    );

    expect(screen.getByTestId('decision-context-state')).toHaveTextContent('4');
  });

  it('renders the structured result in English', () => {
    renderPage(buildAppAskPath('English result'), 'en');

    expect(
      screen.getByRole('heading', { level: 1, name: en.app.ask.structured.resultTitle }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: en.app.ask.structured.checklist.heading }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: en.app.ask.structured.fact.heading }),
    ).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(en.app.ask.structured.provenance);
  });

  it('keeps HTML-like input as text', () => {
    const question = '<script>alert(1)</script>';
    const { container } = renderPage(buildAppAskPath(question));

    expect(screen.getByText(question)).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
  });
});
