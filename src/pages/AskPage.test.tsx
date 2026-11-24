import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { APP_ROUTE_PATHS, AUTH_ROUTE_PATHS } from '@/constants/routes';
import { holdTransient, resolveTransient } from '@/lib/transientNavigation';

const buildAppAskPath = (question: string) =>
  `${APP_ROUTE_PATHS.ask}?ref=${holdTransient(question)}`;
import { I18nProvider } from '@/i18n/I18nContext';
import { en } from '@/i18n/messages/en';
import { ko } from '@/i18n/messages/ko';
import { getReviewFixture } from '@/mocks/reviewResult';
import { AskPage } from '@/pages/AskPage';
import { AuthEntryPage } from '@/pages/AuthEntryPage';

function DecisionContextStateProbe() {
  const location = useLocation();
  const context = (
    (resolveTransient(location.state) ?? location.state) as {
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

function AuthRoundTripHarness() {
  const location = useLocation();
  if (location.pathname === APP_ROUTE_PATHS.ask) return <AskPage />;
  return <AuthEntryPage />;
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

  it.each(['investment', 'study'] as const)(
    'restores the selected check after %s authentication and starts a new review unchecked',
    (type) => {
      const path = buildAppAskPath('원래 질문');
      const view = render(
        <MemoryRouter initialEntries={[path]}>
          <I18nProvider locale="ko">
            <AuthRoundTripHarness />
          </I18nProvider>
        </MemoryRouter>,
      );
      const checklist = screen
        .getByRole('heading', { name: ko.app.ask.structured.checklist.heading })
        .closest('section')!;
      const firstCheck = within(checklist).getAllByRole('button')[0];
      fireEvent.click(firstCheck);
      fireEvent.click(
        screen.getByRole('link', { name: new RegExp(ko.app.ask.handoff[type].title) }),
      );
      fireEvent.click(screen.getByRole('button', { name: ko.auth.entry.cancel }));
      const restored = screen
        .getByRole('heading', { name: ko.app.ask.structured.checklist.heading })
        .closest('section')!;
      expect(within(restored).getAllByRole('button')[0]).toHaveAttribute('aria-pressed', 'true');
      expect(within(restored).getByText('1/4 확인')).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: new RegExp(ko.app.ask.handoff[type].title) }),
      ).toHaveFocus();
      view.unmount();
      renderPage(buildAppAskPath('새 질문'));
      expect(screen.getByText('0/4 확인')).toBeInTheDocument();
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

      // 질문이 page-title(h1)이고, 결과 구분은 메타 글자로 남는다.
      expect(screen.getByRole('heading', { level: 1, name: question })).toBeInTheDocument();
      expect(
        screen.getByText(new RegExp(`^${ko.app.ask.structured.resultTitle} ·`)),
      ).toBeInTheDocument();
    },
  );

  it('renders the full semantic hierarchy in canonical order', () => {
    renderPage(buildAppAskPath('순서 확인'));

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const headings = [
      screen.getByRole('heading', { level: 1, name: '순서 확인' }),
      ...[
        ko.app.ask.structured.checklist.heading,
        ko.app.ask.structured.fact.heading,
        ko.app.ask.structured.inference.heading,
        ko.app.ask.structured.unknown.heading,
      ].map((name) => screen.getByRole('heading', { level: 2, name })),
    ];

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
    expect(screen.queryByText(new RegExp(`^${ko.app.ask.structured.resultTitle} ·`))).toBeNull();

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.getByRole('heading', { level: 1, name: '로딩 확인' })).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`^${ko.app.ask.structured.resultTitle} ·`)),
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('separates Review Error from Partial Result and retries to success', () => {
    vi.useFakeTimers();
    renderPage(`${buildAppAskPath('오류를 다시 시도')}&fixture=error`);

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
    expect(screen.getByRole('heading', { level: 1, name: '오류를 다시 시도' })).toBeInTheDocument();
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

  it('does not include a decision context in the study authentication intent', () => {
    renderPage(buildAppAskPath('study context'));
    fireEvent.click(screen.getByRole('link', { name: new RegExp(ko.app.ask.handoff.study.title) }));
    expect(screen.getByTestId('decision-context-state')).toBeEmptyDOMElement();
  });

  it('renders the structured result in English', () => {
    renderPage(buildAppAskPath('English result'), 'en');

    expect(screen.getByRole('heading', { level: 1, name: 'English result' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: en.app.ask.structured.checklist.heading }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: en.app.ask.structured.fact.heading }),
    ).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(en.app.ask.structured.provenance);
  });

  it('gives the hand-off a single Strong action and a Subtle study note, without result-screen context controls', () => {
    renderPage(buildAppAskPath('행동 위계'));

    const investment = screen.getByRole('link', { name: ko.app.ask.handoff.investment.title });
    const study = screen.getByRole('link', { name: ko.app.ask.handoff.study.title });
    expect(investment.className).toContain('bg-primary');
    expect(study.className).toContain('bg-brand-subtle');
    expect(study.className).not.toContain('bg-primary');
    // F1-G8 승인 전: 맥락 포함 Checkbox·사실 칩은 결과 화면에 두지 않는다.
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { pressed: true })).not.toBeInTheDocument();
  });

  it('shows the fact as-of date as YYYY.MM.DD while keeping the ISO value in dateTime', () => {
    const { container } = renderPage(buildAppAskPath('기준일 표기'));

    const asOf = getReviewFixture().facts[0].asOf;
    const time = container.querySelector(`time[datetime="${asOf}"]`)!;
    expect(time).toHaveTextContent(asOf.replaceAll('-', '.'));
  });

  it('keeps HTML-like input as text', () => {
    const question = '<script>alert(1)</script>';
    const { container } = renderPage(buildAppAskPath(question));

    expect(screen.getByText(question)).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
  });
});
