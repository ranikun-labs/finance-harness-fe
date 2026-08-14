import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { APP_ROUTE_PATHS, AUTH_ROUTE_PATHS, buildAppJournalNewPath } from '@/constants/routes';
import type { AuthPresentationDriver, AuthResumeIntent } from '@/features/auth/authPresentation';
import { I18nProvider } from '@/i18n/I18nContext';
import { ko } from '@/i18n/messages/ko';
import { SAMPLE_DECISION_CONTEXT } from '@/mocks/decisionContext';
import type { ReviewJournalHandoff } from '@/mocks/reviewResult';
import { AuthEntryPage } from '@/pages/AuthEntryPage';
import { JournalNewPage } from '@/pages/JournalNewPage';

function ReviewDestination() {
  const location = useLocation();
  return (
    <output data-testid="review-return">
      {location.pathname + location.search + location.hash}
    </output>
  );
}

function renderAuth(intent?: AuthResumeIntent, driver?: AuthPresentationDriver) {
  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: AUTH_ROUTE_PATHS.entry,
          state: { authResumeIntent: intent },
        },
      ]}
    >
      <I18nProvider locale="ko">
        <Routes>
          <Route path={AUTH_ROUTE_PATHS.entry} element={<AuthEntryPage driver={driver} />} />
          <Route path={APP_ROUTE_PATHS.ask} element={<ReviewDestination />} />
          <Route path={APP_ROUTE_PATHS.journalNew} element={<JournalNewPage />} />
        </Routes>
      </I18nProvider>
    </MemoryRouter>,
  );
}

function createReviewIntent(kind: 'investment' | 'study' = 'investment'): AuthResumeIntent {
  const reviewHandoff: ReviewJournalHandoff =
    kind === 'investment'
      ? {
          kind,
          originalQuestion: '부분 검토를 이어갈까요?',
          returnTarget: '/app/ask?q=%EB%B6%80%EB%B6%84&fixture=partial#result',
        }
      : {
          kind,
          originalQuestion: '무엇을 더 확인할까요?',
          returnTarget: '/app/ask?q=%ED%95%99%EC%8A%B5&fixture=partial',
          learningDraft: {
            title: '무엇을 더 확인할까요?',
            keyContent: '화면에 표시된 안내',
            openQuestions: ['더 확인할 질문'],
          },
        };

  return {
    targetRoute: buildAppJournalNewPath(kind),
    recordType: kind,
    returnTarget: reviewHandoff.returnTarget,
    reviewHandoff,
    ...(kind === 'investment'
      ? { decisionContext: SAMPLE_DECISION_CONTEXT, decisionContextEnabled: true }
      : {}),
  };
}

describe('AuthEntryPage presentation seam', () => {
  it('is a provider-neutral public surface without a primary signup journey', () => {
    renderAuth(createReviewIntent());

    expect(
      screen.getByRole('heading', { level: 1, name: ko.auth.entry.heading }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ko.auth.entry.providerAction })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /signup|회원가입/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByText(ko.auth.entry.providerNeutralNotice)).toBeInTheDocument();
  });

  it('does not manufacture success when no explicit driver is provided', () => {
    renderAuth(createReviewIntent('study'));

    fireEvent.click(screen.getByRole('button', { name: ko.auth.entry.providerAction }));

    expect(screen.getByRole('status')).toHaveTextContent(ko.auth.entry.unavailable);
    expect(screen.getByTestId('auth-entry')).toBeInTheDocument();
    expect(screen.queryByLabelText('무엇을 배웠나요?')).not.toBeInTheDocument();
  });

  it('does not invent a destination when an explicit driver has no resume intent', async () => {
    const driver: AuthPresentationDriver = {
      resolve: vi.fn().mockResolvedValue('authenticated'),
    };
    renderAuth(undefined, driver);

    fireEvent.click(screen.getByRole('button', { name: ko.auth.entry.providerAction }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByTestId('auth-entry')).toBeInTheDocument();
  });

  it('cancels back to the exact originating Partial Review target', () => {
    const intent = createReviewIntent();
    renderAuth(intent);

    fireEvent.click(screen.getByRole('button', { name: ko.auth.entry.cancel }));

    expect(screen.getByTestId('review-return')).toHaveTextContent(intent.returnTarget);
  });

  it('uses Journal Entry Choice as the no-intent cancel destination', () => {
    renderAuth();

    fireEvent.click(screen.getByRole('button', { name: ko.auth.entry.cancelEntry }));

    expect(
      screen.getByRole('heading', { name: ko.app.journalNew.entryChoice.heading }),
    ).toBeInTheDocument();
  });

  it('presents explicit failure, retry, and then resumes the selected Learning Note intent', async () => {
    const intent = createReviewIntent('study');
    const driver: AuthPresentationDriver = {
      resolve: vi
        .fn<() => Promise<'guest' | 'authenticated'>>()
        .mockResolvedValueOnce('guest')
        .mockResolvedValueOnce('authenticated'),
    };
    renderAuth(intent, driver);

    fireEvent.click(screen.getByRole('button', { name: ko.auth.entry.providerAction }));
    expect(screen.getByRole('status', { name: ko.auth.entry.loading })).toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByText(ko.auth.entry.failureDescription)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: ko.auth.entry.retry }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: ko.app.journalNew.study })).toBeInTheDocument(),
    );
    expect(screen.getByLabelText('무엇을 배웠나요?')).toHaveValue(
      intent.reviewHandoff?.learningDraft?.title,
    );
    expect(screen.getByText(ko.auth.entry.resumeNotice)).toBeInTheDocument();
  });

  it('resumes an investment Editor with Decision Context ON and focuses its heading only for explicit auth', async () => {
    const intent = createReviewIntent();
    const driver: AuthPresentationDriver = {
      resolve: vi.fn().mockResolvedValue('authenticated'),
    };
    renderAuth(intent, driver);

    fireEvent.click(screen.getByRole('button', { name: ko.auth.entry.providerAction }));
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: ko.app.journalNew.investment }),
      ).toBeInTheDocument(),
    );

    const panel = screen.getByTestId('decision-context-capture');
    expect(within(panel).getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { name: ko.app.journalNew.investment }),
    );
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
