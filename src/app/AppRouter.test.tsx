import { render, screen } from '@testing-library/react';
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
    it.each([buildLocaleHomePath('ko'), buildLocaleHomePath('en')])(
      'renders the public home at %s',
      (path) => {
        renderAt(path);
        expect(screen.getByRole('heading', { name: /공개 웹 홈/ })).toBeInTheDocument();
      },
    );

    it.each([buildFeaturesPath('ko'), buildFeaturesPath('en')])(
      'renders features at %s',
      (path) => {
        renderAt(path);
        expect(screen.getByRole('heading', { name: /기능 소개/ })).toBeInTheDocument();
      },
    );

    it.each([buildLearnPath('ko', 'basics'), buildLearnPath('en', 'basics')])(
      'renders learn at %s',
      (path) => {
        renderAt(path);
        expect(screen.getByRole('heading', { name: /학습/ })).toBeInTheDocument();
      },
    );

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

  describe('app ownership (/app/*)', () => {
    it('renders the app home at /app', () => {
      renderAt(APP_ROUTE_PATHS.appHome);
      expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
    });

    it.each([
      [APP_ROUTE_PATHS.ask, 'Ask 결과'],
      [APP_ROUTE_PATHS.journalList, '기록 목록'],
      [APP_ROUTE_PATHS.onboarding, '온보딩'],
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
      expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: /공개 웹 홈/ })).toBeNull();
    });

    it('matches /app/ask as the app screen, not public', () => {
      renderAt(APP_ROUTE_PATHS.ask);
      expect(screen.getByRole('heading', { name: 'Ask 결과' })).toBeInTheDocument();
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
      'shows the bottom tab bar on %s',
      (path) => {
        renderAt(path);
        expect(bottomNav()).not.toBeNull();
      },
    );

    it.each([
      [APP_ROUTE_PATHS.onboarding, '온보딩'],
      [buildAppJournalNewPath('investment'), '일지 저장 (투자 기록)'],
      [buildAppJournalDetailPath('sample-id'), /일지 상세/],
      [buildAppJournalReviewPath('sample-id'), /복기/],
    ])('hides the bottom tab bar on %s', (path, heading) => {
      renderAt(path);
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
      expect(bottomNav()).toBeNull();
    });

    it('does not show the app bottom tab bar on the public surface', () => {
      renderAt(buildLocaleHomePath('ko'));
      expect(bottomNav()).toBeNull();
    });
  });
});
