import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AppRouter } from '@/app/AppRouter';
import {
  APP_ROUTE_PATHS,
  AUTH_ROUTE_PATHS,
  buildAppAskPath,
  buildAppJournalDetailPath,
  buildAppJournalNewPath,
  buildAppJournalReviewPath,
  buildFeaturesPath,
  buildLearnPath,
  buildLocaleHomePath,
} from '@/constants/routes';
import { ko } from '@/i18n/messages/ko';
import type { JournalReadPort } from '@/features/journal-read/model/journalReadPort';
import type { AuthPresentationConsumer } from '@/features/auth/authPresentation';
import { JOURNAL_ENTRIES } from '@/mocks/journalEntries';

const APP_NOT_FOUND = '페이지를 찾을 수 없어요';
const PUBLIC_NOT_FOUND = '공개 페이지를 찾을 수 없어요';
const TEST_JOURNAL_ID = '550e8400-e29b-41d4-a716-446655440000';

const TEST_JOURNAL_READ_PORT: JournalReadPort = {
  list: async () => ({
    ok: true,
    data: {
      items: [
        {
          journalId: TEST_JOURNAL_ID,
          type: 'investment',
          occurredAt: '2026-08-12T14:30:15.123',
          timeZone: 'Asia/Seoul',
          assetName: 'ETF',
          action: 'buy',
        },
      ],
      nextCursor: null,
    },
  }),
  detail: async (journalId) =>
    journalId === TEST_JOURNAL_ID
      ? {
          ok: true,
          data: {
            journalId,
            type: 'investment',
            occurredAt: '2026-08-12T14:30:15.123',
            timeZone: 'Asia/Seoul',
            createdAt: '2026-08-12T05:31:02.123Z',
            updatedAt: '2026-08-12T05:31:02.123Z',
            assetName: 'ETF',
            action: 'buy',
            reasoning: 'thesis',
            emotion: null,
          },
        }
      : { ok: false, error: { code: 'journal_not_found', status: 404 } },
};

function RouterProbe() {
  const location = useLocation();
  const locationState = location.state as {
    authResumeIntent?: { recordType?: string };
  } | null;

  return (
    <>
      <span data-testid="router-location" hidden>
        {`${location.pathname}${location.search}${location.hash}`}
      </span>
      <span data-testid="router-auth-record-type" hidden>
        {locationState?.authResumeIntent?.recordType ?? ''}
      </span>
    </>
  );
}

function renderAt(
  path: string,
  authPresentation?: AuthPresentationConsumer,
  journalReadPort: JournalReadPort = TEST_JOURNAL_READ_PORT,
) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RouterProbe />
      <AppRouter authPresentation={authPresentation} journalReadPort={journalReadPort} />
    </MemoryRouter>,
  );
}

describe('AppRouter', () => {
  describe('root redirect', () => {
    it('redirects / to the default locale public home', () => {
      renderAt('/');
      expect(screen.getByRole('heading', { name: /공개 웹 홈/ })).toBeInTheDocument();
    });
  });

  describe('public web ownership (/:locale)', () => {
    // STEP 7부터 공개 웹은 URL locale에 따라 실제로 다른 언어를 렌더한다 — ko/en이
    // 더 이상 같은(한국어) heading을 공유하지 않으므로 locale별로 기대 문구를 따로 둔다.
    it.each([
      [buildLocaleHomePath('ko'), /공개 웹 홈/],
      [buildLocaleHomePath('en'), /Public Home/],
    ])('renders the public home at %s', (path, heading) => {
      renderAt(path);
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    });

    it.each([
      [buildFeaturesPath('ko'), /기능 소개/],
      [buildFeaturesPath('en'), /Features/],
    ])('renders features at %s', (path, heading) => {
      renderAt(path);
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    });

    it.each([
      [buildLearnPath('ko', 'basics'), /학습/],
      [buildLearnPath('en', 'basics'), /Learn/],
    ])('renders learn at %s', (path, heading) => {
      renderAt(path);
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    });

    it('renders public NotFound for an unsupported locale (no redirect)', () => {
      renderAt('/fr');
      expect(screen.getByRole('heading', { name: PUBLIC_NOT_FOUND })).toBeInTheDocument();
    });

    it('renders public NotFound for an unsupported locale sub-path', () => {
      renderAt('/ja/features');
      expect(screen.getByRole('heading', { name: PUBLIC_NOT_FOUND })).toBeInTheDocument();
    });

    it('renders public NotFound for an unknown sub-path under a supported locale', () => {
      renderAt('/ko/nope');
      expect(screen.getByRole('heading', { name: PUBLIC_NOT_FOUND })).toBeInTheDocument();
    });
  });

  describe('provider-neutral Auth Entry ownership', () => {
    it('renders Auth Entry outside the app shell and primary navigation', () => {
      renderAt(AUTH_ROUTE_PATHS.entry);

      expect(
        screen.getByRole('heading', { level: 1, name: ko.auth.entry.heading }),
      ).toBeInTheDocument();
      expect(screen.getByTestId('auth-entry')).toBeInTheDocument();
      expect(screen.queryByRole('navigation')).toBeNull();
    });

    it('does not auto-authenticate the production composition', () => {
      renderAt(AUTH_ROUTE_PATHS.entry);

      fireEvent.click(screen.getByRole('button', { name: ko.auth.entry.providerAction }));

      expect(screen.getByRole('status')).toHaveTextContent(ko.auth.entry.unavailable);
      expect(screen.getByTestId('auth-entry')).toBeInTheDocument();
    });
  });

  describe('PublicNotFound provider boundary', () => {
    it('renders /fr (unsupported locale) without throwing, using the DEFAULT_LOCALE (ko) copy', () => {
      expect(() => renderAt('/fr')).not.toThrow();
      expect(screen.getByRole('heading', { name: PUBLIC_NOT_FOUND })).toBeInTheDocument();
    });

    it('renders the true top-level "*" catch-all without throwing, using the DEFAULT_LOCALE (ko) copy', () => {
      // "//nope"는 첫 세그먼트가 빈 문자열이라 ":locale"(비어있지 않은 세그먼트 요구)에도
      // "/app"에도 매칭되지 않고, AppRouter.tsx 최상위 <Route path="*"> 안전망에만
      // 도달한다(구현 시 react-router 매칭으로 직접 확인한 유일한 도달 경로).
      expect(() => renderAt('//nope')).not.toThrow();
      expect(screen.getByRole('heading', { name: PUBLIC_NOT_FOUND })).toBeInTheDocument();
    });

    it('renders /en (supported locale) using the en dictionary via the normal PublicLayout provider, not the fallback', () => {
      renderAt(buildLocaleHomePath('en'));
      expect(screen.getByRole('heading', { name: /Public Home/ })).toBeInTheDocument();
    });
  });

  describe('app ownership (/app/*)', () => {
    it('renders the Review Start owner at /app', () => {
      renderAt(APP_ROUTE_PATHS.appHome);
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: new RegExp(ko.app.home.hero.heading),
        }),
      ).toBeInTheDocument();
    });

    it.each([
      [APP_ROUTE_PATHS.ask, ko.app.ask.header.title],
      [APP_ROUTE_PATHS.journalList, ko.app.journalList.title],
      [APP_ROUTE_PATHS.onboarding, ko.app.onboarding.hero.title],
    ])('renders %s', (path, heading) => {
      renderAt(path);
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    });

    it('renders the journal new/detail/review screens', () => {
      renderAt(buildAppJournalNewPath('investment'));
      expect(
        screen.getByRole('heading', { name: ko.app.journalNew.investment }),
      ).toBeInTheDocument();
    });

    it('renders app NotFound for an unknown /app sub-path', () => {
      renderAt(`${APP_ROUTE_PATHS.appHome}/nope`);
      expect(screen.getByRole('heading', { name: APP_NOT_FOUND })).toBeInTheDocument();
    });
  });

  describe('auth-required Journal presentation consumer', () => {
    it('routes a guest Journal List to the Auth Entry without treating it as a grant', async () => {
      renderAt(APP_ROUTE_PATHS.journalList, { state: 'guest' });

      await waitFor(() =>
        expect(
          screen.getByRole('heading', { level: 1, name: ko.auth.entry.heading }),
        ).toBeInTheDocument(),
      );
      expect(
        screen.getByRole('button', { name: ko.auth.entry.cancelReviewStart }),
      ).toBeInTheDocument();
    });

    it('keeps a guest typed Editor intent at Auth Entry with the matching cancel target', async () => {
      renderAt(buildAppJournalNewPath('investment'), { state: 'guest' });

      await waitFor(() =>
        expect(
          screen.getByRole('heading', { level: 1, name: ko.auth.entry.heading }),
        ).toBeInTheDocument(),
      );
      expect(screen.getByRole('button', { name: ko.auth.entry.cancelEntry })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: ko.auth.entry.providerAction }));
      expect(screen.getByRole('status')).toHaveTextContent(ko.auth.entry.unavailable);
    });

    it('renders an authenticated fixture directly at a typed Journal Editor', () => {
      renderAt(buildAppJournalNewPath('study'), { state: 'authenticated' });

      expect(screen.getByRole('heading', { name: ko.app.journalNew.study })).toBeInTheDocument();
      expect(screen.queryByTestId('auth-entry')).not.toBeInTheDocument();
    });

    it('keeps unknown state non-authoritative while preserving the existing Journal surface', () => {
      renderAt(buildAppJournalNewPath('investment'));

      expect(
        screen.getByRole('heading', { name: ko.app.journalNew.investment }),
      ).toBeInTheDocument();
      expect(screen.queryByTestId('auth-entry')).not.toBeInTheDocument();
    });

    it.each([
      [APP_ROUTE_PATHS.appHome, ko.app.home.hero.heading],
      [buildAppAskPath('게스트 검토 결과'), ko.app.ask.structured.resultTitle],
    ])('keeps the guest Review surface public at %s', (path, heading) => {
      renderAt(path, { state: 'guest' });

      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
      expect(screen.queryByTestId('auth-entry')).not.toBeInTheDocument();
    });

    const untypedEntryStates: Array<[string, AuthPresentationConsumer]> = [
      ['guest', { state: 'guest' }],
      ['unknown', { state: 'unknown' }],
      ['authenticated', { state: 'authenticated' }],
    ];

    it.each(untypedEntryStates)(
      'keeps the untyped Journal Entry Choice for the %s presentation state',
      (_label, authPresentation) => {
        renderAt(APP_ROUTE_PATHS.journalNew, authPresentation);

        expect(
          screen.getByRole('heading', { name: ko.app.journalNew.entryChoice.heading }),
        ).toBeInTheDocument();
        expect(screen.queryByTestId('auth-entry')).not.toBeInTheDocument();
        expect(
          screen.queryByRole('heading', { name: ko.app.journalNew.investment }),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole('heading', { name: ko.app.journalNew.study }),
        ).not.toBeInTheDocument();
      },
    );

    const guestProtectedRoutes: Array<[string, string, string | undefined]> = [
      ['Journal List', APP_ROUTE_PATHS.journalList, undefined],
      ['Journal Detail', buildAppJournalDetailPath(JOURNAL_ENTRIES[0].id), undefined],
      ['Retrospective', buildAppJournalReviewPath(JOURNAL_ENTRIES[0].id), undefined],
      ['Investment Editor', buildAppJournalNewPath('investment'), 'investment'],
      ['Learning Editor', buildAppJournalNewPath('study'), 'study'],
    ];

    it.each(guestProtectedRoutes)(
      'routes guest %s through the shared Auth Entry consumer',
      async (_label, path, recordType) => {
        renderAt(path, { state: 'guest' });

        await waitFor(() =>
          expect(
            screen.getByRole('heading', { level: 1, name: ko.auth.entry.heading }),
          ).toBeInTheDocument(),
        );
        if (recordType) {
          expect(screen.getByTestId('router-auth-record-type')).toHaveTextContent(recordType);
        }
      },
    );

    const authenticatedRoutes: Array<[string, string, string]> = [
      ['Journal List', APP_ROUTE_PATHS.journalList, ko.app.journalList.title],
      [
        'Journal Detail',
        buildAppJournalDetailPath(JOURNAL_ENTRIES[0].id),
        ko.app.journalDetail.headerTitle,
      ],
      [
        'Retrospective',
        buildAppJournalReviewPath(JOURNAL_ENTRIES[0].id),
        ko.app.journalReview.headerTitle,
      ],
      ['Investment Editor', buildAppJournalNewPath('investment'), ko.app.journalNew.investment],
      ['Learning Editor', buildAppJournalNewPath('study'), ko.app.journalNew.study],
    ];

    it.each(authenticatedRoutes)(
      'renders authenticated fixture %s at its intended surface',
      (_label, path, heading) => {
        renderAt(path, { state: 'authenticated' });

        expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
        expect(screen.queryByTestId('auth-entry')).not.toBeInTheDocument();
      },
    );

    const reviewStartFallbackRoutes: Array<[string, string]> = [
      ['Journal List', APP_ROUTE_PATHS.journalList],
      ['Journal Detail', buildAppJournalDetailPath(JOURNAL_ENTRIES[0].id)],
      ['Retrospective', buildAppJournalReviewPath(JOURNAL_ENTRIES[0].id)],
    ];

    it.each(reviewStartFallbackRoutes)(
      'uses the canonical Review Start target and matching label when cancelling guest %s',
      async (_label, path) => {
        renderAt(path, { state: 'guest' });

        await waitFor(() =>
          expect(
            screen.getByRole('heading', { level: 1, name: ko.auth.entry.heading }),
          ).toBeInTheDocument(),
        );

        const cancel = screen.getByRole('button', {
          name: ko.auth.entry.cancelReviewStart,
        });
        expect(cancel).toHaveAccessibleName(ko.auth.entry.cancelReviewStart);
        fireEvent.click(cancel);

        await waitFor(() =>
          expect(screen.getByTestId('router-location')).toHaveTextContent(APP_ROUTE_PATHS.appHome),
        );
        expect(
          screen.getByRole('heading', {
            level: 1,
            name: new RegExp(ko.app.home.hero.heading),
          }),
        ).toBeInTheDocument();
      },
    );
  });

  describe('route priority: /app wins over /:locale', () => {
    it('matches /app as the app home, not a public locale named "app"', () => {
      renderAt(APP_ROUTE_PATHS.appHome);
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: new RegExp(ko.app.home.hero.heading),
        }),
      ).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: /공개 웹 홈/ })).toBeNull();
    });

    it('matches /app/ask as the app screen, not public', () => {
      renderAt(APP_ROUTE_PATHS.ask);
      expect(screen.getByRole('heading', { name: ko.app.ask.header.title })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: PUBLIC_NOT_FOUND })).toBeNull();
    });
  });

  describe('public and app NotFound do not mix', () => {
    it('shows the public NotFound (not the app one) on the public surface', () => {
      renderAt('/ko/missing');
      expect(screen.getByRole('heading', { name: PUBLIC_NOT_FOUND })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: APP_NOT_FOUND })).toBeNull();
    });

    it('shows the app NotFound (not the public one) on the app surface', () => {
      renderAt(`${APP_ROUTE_PATHS.appHome}/missing`);
      expect(screen.getByRole('heading', { name: APP_NOT_FOUND })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: PUBLIC_NOT_FOUND })).toBeNull();
    });
  });

  describe('clean cutover: legacy unprefixed paths render neither an app screen nor a redirect', () => {
    const LEGACY_PATHS = [
      '/onboarding',
      '/ask',
      '/journal',
      '/journal/new',
      '/journal/example',
      '/journal/example/review',
    ];

    it.each(LEGACY_PATHS)('%s falls through to public NotFound', (path) => {
      renderAt(path);
      // 공개 NotFound가 렌더된다 = /app으로 redirect되지도, 앱 화면이 렌더되지도 않음.
      expect(screen.getByRole('heading', { name: PUBLIC_NOT_FOUND })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: '기록 목록' })).toBeNull();
      expect(screen.queryByRole('heading', { name: '온보딩' })).toBeNull();
    });
  });

  describe('bottom tab visibility', () => {
    const bottomNav = () => screen.queryByRole('navigation', { name: '주요 화면 이동' });

    it.each([APP_ROUTE_PATHS.appHome, APP_ROUTE_PATHS.ask, APP_ROUTE_PATHS.journalList])(
      'renders the adaptive primary navigation shell on %s',
      (path) => {
        renderAt(path);
        expect(bottomNav()).not.toBeNull();
      },
    );

    it.each([[APP_ROUTE_PATHS.onboarding, ko.app.onboarding.hero.title]])(
      'keeps the primary navigation outside the onboarding surface on %s',
      (path, heading) => {
        renderAt(path);
        expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
        expect(bottomNav()).toBeNull();
      },
    );

    it.each([
      [buildAppJournalNewPath('investment'), ko.app.journalNew.investment],
      [`${APP_ROUTE_PATHS.journalNew}?type=unknown`, ko.app.journalNew.invalidType.heading],
      [buildAppJournalDetailPath(JOURNAL_ENTRIES[0].id), ko.app.journalDetail.headerTitle],
      [buildAppJournalReviewPath(JOURNAL_ENTRIES[0].id), ko.app.journalReview.headerTitle],
    ])('keeps adaptive primary navigation on internal journal route %s', (path, heading) => {
      renderAt(path);
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
      expect(bottomNav()).not.toBeNull();
      expect(bottomNav()).toHaveClass('hidden', 'md:flex');
    });

    it('does not show the app bottom tab bar on the public surface', () => {
      renderAt(buildLocaleHomePath('ko'));
      expect(bottomNav()).toBeNull();
    });

    it('marks only Review active at /app', () => {
      renderAt(APP_ROUTE_PATHS.appHome);

      const reviewLink = screen.getByRole('link', { name: ko.nav.review });
      const journalLink = screen.getByRole('link', { name: ko.nav.journal });

      expect(reviewLink).toHaveAttribute('aria-current', 'page');
      expect(journalLink).not.toHaveAttribute('aria-current');
    });
  });

  describe('main landmark ownership', () => {
    it.each([
      ['Journal List', APP_ROUTE_PATHS.journalList],
      ['Journal New', buildAppJournalNewPath('investment')],
      ['Journal Detail', buildAppJournalDetailPath(JOURNAL_ENTRIES[0].id)],
      ['Journal Review', buildAppJournalReviewPath(JOURNAL_ENTRIES[0].id)],
      ['Journal Detail Not Found', buildAppJournalDetailPath('unknown-record-id')],
      ['Journal Review Not Found', buildAppJournalReviewPath('unknown-record-id')],
    ])('renders exactly one main landmark for %s', (_label, path) => {
      renderAt(path);

      expect(document.querySelectorAll('main')).toHaveLength(1);
      expect(screen.getAllByRole('main')).toHaveLength(1);
    });
  });

  describe('journal adaptive workspace', () => {
    it('keeps the list route as the selection surface without inventing a detail record', () => {
      renderAt(APP_ROUTE_PATHS.journalList);

      expect(screen.getByTestId('journal-workspace')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 1, name: ko.app.journalList.title }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          level: 2,
          name: ko.app.journalWorkspace.detailPrompt.heading,
        }),
      ).toBeInTheDocument();
      expect(screen.getAllByRole('main')).toHaveLength(1);
    });

    it('keeps the direct detail route selected and renders server-owned detail data', async () => {
      renderAt(buildAppJournalDetailPath(TEST_JOURNAL_ID));

      const workspace = screen.getByTestId('journal-workspace');
      expect(workspace).toBeInTheDocument();
      await waitFor(() =>
        expect(within(workspace).getByRole('link', { current: 'page' })).toHaveAttribute(
          'href',
          buildAppJournalDetailPath(TEST_JOURNAL_ID),
        ),
      );
      expect(screen.getByText('thesis')).toBeInTheDocument();
      expect(screen.queryByTestId('decision-context-snapshot')).not.toBeInTheDocument();
      expect(screen.getAllByRole('main')).toHaveLength(1);
    });
  });
});
