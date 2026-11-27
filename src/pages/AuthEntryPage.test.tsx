import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { APP_ROUTE_PATHS, AUTH_ROUTE_PATHS, buildAppJournalNewPath } from '@/constants/routes';
import type { AuthPresentationDriver, AuthResumeIntent } from '@/features/auth/authPresentation';
import { I18nProvider } from '@/i18n/I18nContext';
import { en } from '@/i18n/messages/en';
import { ko } from '@/i18n/messages/ko';
import { SAMPLE_DECISION_CONTEXT } from '@/mocks/decisionContext';
import type { ReviewJournalHandoff } from '@/mocks/reviewResult';
import { FinanceReferenceAuthError } from '@/features/auth/financeReferenceAuth';
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

it('returns to the journal list after successful sign-in from the list', async () => {
  const driver: AuthPresentationDriver = { resolve: vi.fn().mockResolvedValue('authenticated') };
  render(
    <MemoryRouter
      initialEntries={[{ pathname: AUTH_ROUTE_PATHS.entry, state: { resumeJournalList: true } }]}
    >
      <I18nProvider locale="ko">
        <Routes>
          <Route path={AUTH_ROUTE_PATHS.entry} element={<AuthEntryPage driver={driver} />} />
          <Route path={APP_ROUTE_PATHS.journalList} element={<ReviewDestination />} />
        </Routes>
      </I18nProvider>
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole('button', { name: ko.auth.entry.providerAction }));
  expect(await screen.findByTestId('review-return')).toHaveTextContent(APP_ROUTE_PATHS.journalList);
});

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
  it('shows the learning note purpose in Korean', () => {
    renderAuth(createReviewIntent('study'));
    expect(screen.getByRole('heading', { name: ko.auth.entry.studyHeading })).toBeInTheDocument();
  });

  it('shows the record purpose in English', () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: AUTH_ROUTE_PATHS.entry,
            state: { authResumeIntent: createReviewIntent('study') },
          },
        ]}
      >
        <I18nProvider locale="en">
          <AuthEntryPage />
        </I18nProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: en.auth.entry.studyHeading })).toBeInTheDocument();
  });

  it('is a provider-neutral public surface without a primary signup journey', () => {
    renderAuth(createReviewIntent());

    expect(
      screen.getByRole('heading', { level: 1, name: ko.auth.entry.investmentHeading }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: ko.auth.entry.providerAction }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /signup|회원가입/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(ko.auth.entry.unavailable);
  });

  it('does not manufacture success when no explicit driver is provided', () => {
    renderAuth(createReviewIntent('study'));

    expect(
      screen.queryByRole('button', { name: ko.auth.entry.providerAction }),
    ).not.toBeInTheDocument();
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

    expect(screen.getByTestId('review-return')).toHaveTextContent(
      '/app/ask?fixture=partial#result',
    );
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

  it('explains a direct entry failure and focuses the editor after retry', async () => {
    const intent: AuthResumeIntent = {
      targetRoute: buildAppJournalNewPath('investment'),
      recordType: 'investment',
      returnTarget: APP_ROUTE_PATHS.journalNew,
    };
    const driver: AuthPresentationDriver = {
      resolve: vi.fn().mockResolvedValueOnce('guest').mockResolvedValueOnce('authenticated'),
    };
    renderAuth(intent, driver);
    fireEvent.click(screen.getByRole('button', { name: ko.auth.entry.providerAction }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      ko.auth.entry.directFailureDescription,
    );
    fireEvent.click(screen.getByRole('button', { name: ko.auth.entry.retry }));
    const heading = await screen.findByRole('heading', { name: ko.app.journalNew.investment });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.queryByText(ko.auth.entry.resumeNotice)).not.toBeInTheDocument();
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
    // 포커스 이동은 제목 렌더 이후 effect에서 일어나므로, 부하가 있는 CI에서도 안정적이도록 기다린다.
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('heading', { name: ko.app.journalNew.investment }),
      ),
    );
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});

describe('AuthEntryPage DEV reference panel', () => {
  function renderReference(
    options: {
      signup?: (credentials: { email: string; password: string }) => Promise<void>;
      login?: () => Promise<void>;
    } = {},
  ) {
    return render(
      <MemoryRouter initialEntries={[AUTH_ROUTE_PATHS.entry]}>
        <I18nProvider locale="ko">
          <AuthEntryPage
            financeReferenceAuth={{
              enabled: true,
              login: options.login ?? vi.fn().mockResolvedValue(undefined),
              signup: options.signup,
            }}
          />
        </I18nProvider>
      </MemoryRouter>,
    );
  }

  it('shows the signup form only when a signup handler is supplied (flag on, non-PROD)', () => {
    renderReference({ signup: vi.fn().mockResolvedValue(undefined) });
    expect(screen.getByTestId('finance-reference-login')).toBeInTheDocument();
    expect(screen.getByTestId('finance-reference-signup')).toBeInTheDocument();
  });

  it('hides signup while keeping password login when no signup handler is supplied', () => {
    renderReference();
    expect(screen.getByTestId('finance-reference-login')).toBeInTheDocument();
    expect(screen.queryByTestId('finance-reference-signup')).not.toBeInTheDocument();
  });

  it('creates an account with email and password, then prefills the login ID without signing in', async () => {
    const signup = vi.fn().mockResolvedValue(undefined);
    renderReference({ signup });

    const signupForm = screen.getByTestId('finance-reference-signup');
    fireEvent.change(within(signupForm).getByLabelText(ko.auth.entry.signupEmail), {
      target: { value: 'dev.account@example.test' },
    });
    const signupPassword = within(signupForm).getByLabelText(ko.auth.entry.signupPassword);
    fireEvent.change(signupPassword, { target: { value: 'devpass2026' } });
    fireEvent.click(screen.getByTestId('finance-reference-signup-submit'));

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(ko.auth.entry.signupDone),
    );
    expect(signup).toHaveBeenCalledWith(
      {
        email: 'dev.account@example.test',
        password: 'devpass2026',
      },
      expect.any(AbortSignal),
    );
    expect(signupPassword).toHaveValue('');
    expect(screen.getByLabelText(ko.auth.entry.referenceUserId)).toHaveValue(
      'dev.account@example.test',
    );
  });

  it('shows the duplicate-account message on 409 and clears the password field', async () => {
    const signup = vi.fn().mockRejectedValue(new FinanceReferenceAuthError('account_exists'));
    renderReference({ signup });

    const signupForm = screen.getByTestId('finance-reference-signup');
    fireEvent.change(within(signupForm).getByLabelText(ko.auth.entry.signupEmail), {
      target: { value: 'dup@example.test' },
    });
    const signupPassword = within(signupForm).getByLabelText(ko.auth.entry.signupPassword);
    fireEvent.change(signupPassword, { target: { value: 'devpass2026' } });
    fireEvent.click(screen.getByTestId('finance-reference-signup-submit'));

    await waitFor(() =>
      expect(screen.getByTestId('finance-reference-signup-message')).toHaveTextContent(
        ko.auth.entry.signupExists,
      ),
    );
    expect(screen.getByTestId('finance-reference-signup-message')).toHaveAttribute('role', 'alert');
    expect(signupPassword).toHaveValue('');
  });

  it('maps validation and unavailable failures to their own copy', async () => {
    const signup = vi
      .fn()
      .mockRejectedValueOnce(new FinanceReferenceAuthError('invalid_request'))
      .mockRejectedValueOnce(new FinanceReferenceAuthError('unavailable'));
    renderReference({ signup });

    const signupForm = screen.getByTestId('finance-reference-signup');
    fireEvent.change(within(signupForm).getByLabelText(ko.auth.entry.signupEmail), {
      target: { value: 'a@b.test' },
    });
    fireEvent.change(within(signupForm).getByLabelText(ko.auth.entry.signupPassword), {
      target: { value: 'short' },
    });
    fireEvent.click(screen.getByTestId('finance-reference-signup-submit'));
    await waitFor(() =>
      expect(screen.getByTestId('finance-reference-signup-message')).toHaveTextContent(
        ko.auth.entry.signupInvalid,
      ),
    );

    fireEvent.change(within(signupForm).getByLabelText(ko.auth.entry.signupPassword), {
      target: { value: 'devpass2026' },
    });
    fireEvent.click(screen.getByTestId('finance-reference-signup-submit'));
    await waitFor(() =>
      expect(screen.getByTestId('finance-reference-signup-message')).toHaveTextContent(
        ko.auth.entry.signupUnavailable,
      ),
    );
  });
});
