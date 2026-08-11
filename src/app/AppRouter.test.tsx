import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AppRouter } from '@/app/AppRouter';
import {
  APP_ROUTE_PATHS,
  buildAppJournalDetailPath,
  buildAppJournalNewPath,
  buildAppJournalReviewPath,
  buildFeaturesPath,
  buildLearnPath,
  buildLocaleHomePath,
} from '@/constants/routes';
import { ko } from '@/i18n/messages/ko';
import { JOURNAL_ENTRIES } from '@/mocks/journalEntries';

const APP_NOT_FOUND = '페이지를 찾을 수 없어요';
const PUBLIC_NOT_FOUND = '공개 페이지를 찾을 수 없어요';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRouter />
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
      expect(screen.getByRole('heading', { name: '일지 저장 (투자 기록)' })).toBeInTheDocument();
    });

    it('renders app NotFound for an unknown /app sub-path', () => {
      renderAt(`${APP_ROUTE_PATHS.appHome}/nope`);
      expect(screen.getByRole('heading', { name: APP_NOT_FOUND })).toBeInTheDocument();
    });
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
      [buildAppJournalNewPath('investment'), '일지 저장 (투자 기록)'],
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

    it('keeps the direct detail route selected and exposes its immutable context snapshot', () => {
      renderAt(buildAppJournalDetailPath(JOURNAL_ENTRIES[0].id));

      const workspace = screen.getByTestId('journal-workspace');
      expect(workspace).toBeInTheDocument();
      expect(within(workspace).getByRole('link', { current: 'page' })).toHaveAttribute(
        'href',
        buildAppJournalDetailPath(JOURNAL_ENTRIES[0].id),
      );
      expect(screen.getByTestId('decision-context-snapshot')).toBeInTheDocument();
      expect(screen.getAllByRole('main')).toHaveLength(1);
    });
  });
});
